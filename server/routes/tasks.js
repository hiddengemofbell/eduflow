const express = require('express');
const router = express.Router();
const { query, getOne, run } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const TASK_TYPES = ['CURRICULAR', 'EXTRACURRICULAR', 'ORG'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

const parseTaskId = (value) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const normalizeDate = (value) => {
  if (!value) return value;
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.includes('T')) {
      return trimmed.split('T')[0];
    }
    return trimmed;
  }
  return value;
};

const validDate = (value) => {
  const str = normalizeDate(value);
  if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [year, month, day] = str.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
};
const validTime = (value) => value === null || value === undefined || value === '' || (typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,6})?)?$/.test(value));

const parseOptionalUserId = (value) => {
  if (value === null || value === undefined || value === '') return null;
  return parseTaskId(value);
};

const formatTask = (task) => {
  if (!task) return task;
  return {
    ...task,
    due_date: normalizeDate(task.due_date)
  };
};

const isOrganizationMember = async (userId, organizationId) => {
  const member = await getOne('SELECT id, organization_id FROM users WHERE id = ?', [Number(userId)]);
  return Boolean(member && String(member.organization_id) === String(organizationId));
};

// Get Tasks for logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await getOne('SELECT organization_id, account_type FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(401).json({ message: 'User account no longer exists.' });
    }

    let sql = `
      SELECT t.*, 
             u_owner.name as owner_name, 
             u_assignee.name as assignee_name,
             o.name as organization_name
      FROM tasks t
      LEFT JOIN users u_owner ON t.owner_id = u_owner.id
      LEFT JOIN users u_assignee ON t.assigned_to = u_assignee.id
      LEFT JOIN organizations o ON t.organization_id = o.id
      WHERE t.owner_id = ? OR t.assigned_to = ?
    `;
    const params = [userId, userId];

    if (user && user.organization_id) {
      sql += ` OR (t.organization_id = ? AND (t.assigned_to IS NULL OR ? = 'ORG_ADMIN'))`;
      params.push(user.organization_id, user.account_type);
    }

    sql += ` ORDER BY t.due_date ASC, t.due_time ASC`;

    const tasks = await query(sql, params);
    res.json({ tasks: tasks.map(formatTask) });
  } catch (error) {
    console.error('Fetch tasks error:', error);
    res.status(500).json({ message: 'Server error fetching tasks.' });
  }
});

// Create Task
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, task_type, due_date, due_time, priority, assigned_to } = req.body;

    if (!title || !due_date) {
      return res.status(400).json({ message: 'Title and due date are required.' });
    }

    const type = task_type || 'CURRICULAR';
    const cleanDueDate = normalizeDate(due_date);
    if (typeof title !== 'string' || !title.trim() || title.trim().length > 200 || (description !== undefined && (typeof description !== 'string' || description.length > 10000)) || !TASK_TYPES.includes(type) || !validDate(cleanDueDate) || !validTime(due_time) || !PRIORITIES.includes(priority || 'MEDIUM')) {
      return res.status(400).json({ message: 'One or more task fields are invalid.' });
    }

    let targetOrgId = null;
    let targetAssignedTo = null;

    if (type === 'ORG') {
      const user = await getOne('SELECT organization_id, account_type FROM users WHERE id = ?', [req.user.id]);
      if (!user || !user.organization_id || user.account_type !== 'ORG_ADMIN') {
        return res.status(403).json({ message: 'Only Organization Admins can create organization-assigned tasks.' });
      }
      targetOrgId = user.organization_id;
      targetAssignedTo = parseOptionalUserId(assigned_to);
      if (assigned_to !== null && assigned_to !== undefined && assigned_to !== '' && !targetAssignedTo) {
        return res.status(400).json({ message: 'The selected assignee is invalid.' });
      }
      if (targetAssignedTo && !(await isOrganizationMember(targetAssignedTo, targetOrgId))) {
        return res.status(400).json({ message: 'The assignee must be a member of this organization.' });
      }
    }

    const taskPriority = priority || 'MEDIUM';
    const initialStatus = 'PENDING';
    const optionalTime = due_time ? due_time.trim() : null;

    const result = await run(
      `INSERT INTO tasks (owner_id, assigned_to, organization_id, title, description, task_type, due_date, due_time, priority, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, targetAssignedTo, targetOrgId, title.trim(), description || '', type, cleanDueDate, optionalTime, taskPriority, initialStatus]
    );

    const createdTask = await getOne(
      `SELECT t.*, u_owner.name as owner_name, u_assignee.name as assignee_name 
       FROM tasks t 
       LEFT JOIN users u_owner ON t.owner_id = u_owner.id
       LEFT JOIN users u_assignee ON t.assigned_to = u_assignee.id
       WHERE t.id = ?`,
      [result.id]
    );

    res.status(201).json({
      message: 'Task created successfully',
      task: formatTask(createdTask)
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error creating task.' });
  }
});

// Update Task
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const taskId = parseTaskId(req.params.id);
    if (!taskId) return res.status(400).json({ message: 'Invalid task ID.' });
    const task = await getOne('SELECT * FROM tasks WHERE id = ?', [taskId]);

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const user = await getOne('SELECT id, organization_id, account_type FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(401).json({ message: 'User account no longer exists.' });
    }

    const isOwner = task.owner_id === user.id;
    const isOrgAdmin = user.organization_id && user.organization_id === task.organization_id && user.account_type === 'ORG_ADMIN';
    const isAssignee = task.assigned_to === user.id;

    if (!isOwner && !isOrgAdmin && !isAssignee) {
      return res.status(403).json({ message: 'Not authorized to modify this task.' });
    }

    if (!isOwner && !isOrgAdmin && isAssignee) {
      const { status } = req.body;
      if (!status || !['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value.' });
      }

      await run(
        'UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, taskId]
      );
    } else {
      const title = req.body.title !== undefined ? req.body.title : task.title;
      const description = req.body.description !== undefined ? req.body.description : task.description;
      const task_type = req.body.task_type !== undefined ? req.body.task_type : task.task_type;
      const due_date = normalizeDate(req.body.due_date !== undefined ? req.body.due_date : task.due_date);
      const due_time = req.body.due_time !== undefined ? req.body.due_time : task.due_time;
      const priority = req.body.priority !== undefined ? req.body.priority : task.priority;
      const status = req.body.status !== undefined ? req.body.status : task.status;
      const requestedAssignee = req.body.assigned_to !== undefined ? req.body.assigned_to : task.assigned_to;
      const assigned_to = parseOptionalUserId(requestedAssignee);

      if (typeof title !== 'string' || !title.trim() || title.trim().length > 200 || typeof description !== 'string' || description.length > 10000 || !TASK_TYPES.includes(task_type) || !PRIORITIES.includes(priority) || !STATUSES.includes(status) || !validDate(due_date) || !validTime(due_time) || (requestedAssignee !== null && requestedAssignee !== undefined && requestedAssignee !== '' && !assigned_to)) {
        return res.status(400).json({ message: 'One or more task fields are invalid.' });
      }
      // Changing a personal task into an organization task would require an
      // explicit organization association, so keep that state immutable here.
      if ((task.task_type === 'ORG') !== (task_type === 'ORG')) {
        return res.status(400).json({ message: 'Task category cannot be changed to or from Organization Assigned.' });
      }
      if (!task.organization_id && assigned_to) {
        return res.status(400).json({ message: 'Personal tasks cannot be assigned to another user.' });
      }
      if (task.organization_id && assigned_to && !(await isOrganizationMember(assigned_to, task.organization_id))) {
        return res.status(400).json({ message: 'The assignee must be a member of this organization.' });
      }

      await run(
        `UPDATE tasks 
         SET title = ?, description = ?, task_type = ?, due_date = ?, due_time = ?, priority = ?, status = ?, assigned_to = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [title.trim(), description, task_type, due_date, due_time || null, priority, status, assigned_to, taskId]
      );
    }

    const updatedTask = await getOne(
      `SELECT t.*, u_owner.name as owner_name, u_assignee.name as assignee_name 
       FROM tasks t 
       LEFT JOIN users u_owner ON t.owner_id = u_owner.id
       LEFT JOIN users u_assignee ON t.assigned_to = u_assignee.id
       WHERE t.id = ?`,
      [taskId]
    );

    res.json({
      message: 'Task updated successfully',
      task: formatTask(updatedTask)
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error updating task.' });
  }
});

// Delete Task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const taskId = parseTaskId(req.params.id);
    if (!taskId) return res.status(400).json({ message: 'Invalid task ID.' });
    const task = await getOne('SELECT * FROM tasks WHERE id = ?', [taskId]);

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const user = await getOne('SELECT id, organization_id, account_type FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(401).json({ message: 'User account no longer exists.' });
    }
    const isOwner = task.owner_id === user.id;
    const isOrgAdmin = user.organization_id && user.organization_id === task.organization_id && user.account_type === 'ORG_ADMIN';

    if (!isOwner && !isOrgAdmin) {
      return res.status(403).json({ message: 'Only task owner or organization admin can delete this task.' });
    }

    await run('DELETE FROM tasks WHERE id = ?', [taskId]);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error deleting task.' });
  }
});

router.normalizeDate = normalizeDate;
router.validDate = validDate;
router.formatTask = formatTask;

module.exports = router;
