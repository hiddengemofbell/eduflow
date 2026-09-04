const fs = require('fs');
const path = require('path');

const dataFilePath = path.resolve(__dirname, '../data.json');

const loadData = () => {
  if (!fs.existsSync(dataFilePath)) {
    const initialData = {
      users: [],
      organizations: [],
      tasks: [],
      counters: { users: 1, organizations: 1, tasks: 1 }
    };
    fs.writeFileSync(dataFilePath, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  try {
    const content = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    console.error('Error reading data.json, resetting:', e);
    const initialData = {
      users: [],
      organizations: [],
      tasks: [],
      counters: { users: 1, organizations: 1, tasks: 1 }
    };
    fs.writeFileSync(dataFilePath, JSON.stringify(initialData, null, 2));
    return initialData;
  }
};

const saveData = (data) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
};

const initDb = async () => {
  loadData();
  console.log('Database (data.json) initialized successfully.');
};

const query = async (sql, params = []) => {
  const data = loadData();
  const lowerSql = sql.toLowerCase();

  // GET TASKS QUERY WITH JOINS
  if (lowerSql.includes('from tasks t')) {
    let result = data.tasks.map(t => {
      const owner = data.users.find(u => u.id === t.owner_id);
      const assignee = data.users.find(u => u.id === t.assigned_to);
      const org = data.organizations.find(o => o.id === t.organization_id);
      return {
        ...t,
        owner_name: owner ? owner.name : null,
        assignee_name: assignee ? assignee.name : null,
        organization_name: org ? org.name : null
      };
    });

    const userId = params[0];

    result = result.filter(t => {
      const isOwner = t.owner_id === userId;
      const isAssignee = t.assigned_to === userId;
      let isOrgTask = false;

      if (params.length >= 3 && t.organization_id === params[2]) {
        if (t.assigned_to === null || params[3] === 'ORG_ADMIN') {
          isOrgTask = true;
        }
      }
      return isOwner || isAssignee || isOrgTask;
    });

    // Sort by due_date ASC then due_time
    result.sort((a, b) => {
      const dateA = new Date(a.due_date);
      const dateB = new Date(b.due_date);
      if (dateA - dateB !== 0) return dateA - dateB;
      if (a.due_time && b.due_time) return a.due_time.localeCompare(b.due_time);
      if (a.due_time) return -1;
      if (b.due_time) return 1;
      return 0;
    });
    return result;
  }

  // GET ORG MEMBERS QUERY
  if (lowerSql.includes('from users') && lowerSql.includes('organization_id = ?')) {
    const orgId = params[0];
    let members = data.users.filter(u => u.organization_id === orgId)
      .map(u => ({ id: u.id, name: u.name, email: u.email, account_type: u.account_type, created_at: u.created_at }));
    members.sort((a, b) => a.name.localeCompare(b.name));
    return members;
  }

  return [];
};

const getOne = async (sql, params = []) => {
  const data = loadData();
  const lowerSql = sql.toLowerCase();

  if (lowerSql.includes('from users where email = ?')) {
    return data.users.find(u => u.email.toLowerCase() === params[0].toLowerCase()) || null;
  }

  if (lowerSql.includes('from users where id = ?')) {
    return data.users.find(u => u.id === params[0]) || null;
  }

  if (lowerSql.includes('from organizations where join_code = ?')) {
    return data.organizations.find(o => o.join_code.toUpperCase() === params[0].toUpperCase()) || null;
  }

  if (lowerSql.includes('from organizations where id = ?')) {
    return data.organizations.find(o => o.id === params[0]) || null;
  }

  if (lowerSql.includes('from tasks t') && lowerSql.includes('t.id = ?')) {
    const t = data.tasks.find(tk => tk.id === Number(params[0]));
    if (!t) return null;
    const owner = data.users.find(u => u.id === t.owner_id);
    const assignee = data.users.find(u => u.id === t.assigned_to);
    return {
      ...t,
      owner_name: owner ? owner.name : null,
      assignee_name: assignee ? assignee.name : null
    };
  }

  if (lowerSql.includes('from tasks where id = ?')) {
    return data.tasks.find(tk => tk.id === Number(params[0])) || null;
  }

  return null;
};

const run = async (sql, params = []) => {
  const data = loadData();
  const lowerSql = sql.toLowerCase();
  const now = new Date().toISOString();

  if (lowerSql.includes('insert into users')) {
    const id = data.counters.users++;
    const newUser = {
      id,
      name: params[0],
      email: params[1],
      password: params[2],
      account_type: params[3],
      organization_id: params[4] || null,
      created_at: now,
      updated_at: now
    };
    data.users.push(newUser);
    saveData(data);
    return { id, changes: 1 };
  }

  if (lowerSql.includes('insert into organizations')) {
    const id = data.counters.organizations++;
    const newOrg = {
      id,
      name: params[0],
      join_code: params[1],
      created_by: params[2],
      created_at: now
    };
    data.organizations.push(newOrg);
    saveData(data);
    return { id, changes: 1 };
  }

  // INSERT TASK WITH OPTIONAL DUE_TIME
  if (lowerSql.includes('insert into tasks')) {
    const id = data.counters.tasks++;
    const newTask = {
      id,
      owner_id: params[0],
      assigned_to: params[1] || null,
      organization_id: params[2] || null,
      title: params[3],
      description: params[4] || '',
      task_type: params[5],
      due_date: params[6],
      due_time: params[7] || null,
      priority: params[8] || 'MEDIUM',
      status: params[9] || 'PENDING',
      created_at: now,
      updated_at: now
    };
    data.tasks.push(newTask);
    saveData(data);
    return { id, changes: 1 };
  }

  if (lowerSql.includes('update users set organization_id = ?, account_type = ? where id = ?')) {
    const user = data.users.find(u => u.id === params[2]);
    if (user) {
      user.organization_id = params[0];
      user.account_type = params[1];
      user.updated_at = now;
      saveData(data);
      return { id: params[2], changes: 1 };
    }
  }

  if (lowerSql.includes('update users set account_type = ?, organization_id = ? where id = ?')) {
    const user = data.users.find(u => u.id === params[2]);
    if (user) {
      user.account_type = params[0];
      user.organization_id = params[1];
      user.updated_at = now;
      saveData(data);
      return { id: params[2], changes: 1 };
    }
  }

  if (lowerSql.includes('update users set organization_id = ? where id = ?')) {
    const user = data.users.find(u => u.id === params[1]);
    if (user) {
      user.organization_id = params[0];
      user.updated_at = now;
      saveData(data);
      return { id: params[1], changes: 1 };
    }
  }

  if (lowerSql.includes('update tasks set status = ?')) {
    const task = data.tasks.find(t => t.id == params[1]);
    if (task) {
      task.status = params[0];
      task.updated_at = now;
      saveData(data);
      return { id: params[1], changes: 1 };
    }
  }

  // UPDATE TASK FULL WITH OPTIONAL DUE_TIME
  if (lowerSql.includes('update tasks set title = ?')) {
    const task = data.tasks.find(t => t.id == params[8]);
    if (task) {
      task.title = params[0];
      task.description = params[1];
      task.task_type = params[2];
      task.due_date = params[3];
      task.due_time = params[4] || null;
      task.priority = params[5];
      task.status = params[6];
      task.assigned_to = params[7] || null;
      task.updated_at = now;
      saveData(data);
      return { id: params[8], changes: 1 };
    }
  }

  if (lowerSql.includes('delete from tasks where id = ?')) {
    const idx = data.tasks.findIndex(t => t.id == params[0]);
    if (idx !== -1) {
      data.tasks.splice(idx, 1);
      saveData(data);
      return { id: params[0], changes: 1 };
    }
  }

  return { id: 0, changes: 0 };
};

module.exports = {
  initDb,
  query,
  getOne,
  run
};
