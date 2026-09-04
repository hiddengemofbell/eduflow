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

const validDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
const validTime = (value) => value === null || value === undefined || value === '' || (typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value));

const isOrganizationMember = async (userId, organizationId) => {
  const member = await getOne('SELECT id FROM users WHERE id = ?', [Number(userId)]);
  return Boolean(member && member.organization_id === organizationId);
};

// Get Tasks for logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await getOne('SELECT organization_id, account_type FROM users WHERE id = ?', [userId]);

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
    res.json({ tasks });
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
    if (typeof title !== 'string' || !title.trim() || title.trim().length > 200 || (description !== undefined && typeof description !== 'string') || !TASK_TYPES.includes(type) || !validDate(due_date) || !validTime(due_time) || !PRIORITIES.includes(priority || 'MEDIUM')) {
      return res.status(400).json({ message: 'One or more task fields are invalid.' });
    }

    let targetOrgId = null;
    let targetAssignedTo = null;

    if (type === 'ORG') {
      const user = await getOne('SELECT organization_id, account_type FROM users WHERE id = ?', [req.user.id]);
      if (!user.organization_id || user.account_type !== 'ORG_ADMIN') {
        return res.status(403).json({ message: 'Only Organization Admins can create organization-assigned tasks.' });
      }
      targetOrgId = user.organization_id;
      targetAssignedTo = assigned_to || null;
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
      [req.user.id, targetAssignedTo, targetOrgId, title.trim(), description || '', type, due_date, optionalTime, taskPriority, initialStatus]
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
      task: createdTask
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
      const due_date = req.body.due_date !== undefined ? req.body.due_date : task.due_date;
      const due_time = req.body.due_time !== undefined ? req.body.due_time : task.due_time;
      const priority = req.body.priority !== undefined ? req.body.priority : task.priority;
      const status = req.body.status !== undefined ? req.body.status : task.status;
      const assigned_to = req.body.assigned_to !== undefined ? req.body.assigned_to : task.assigned_to;

      if (typeof title !== 'string' || !title.trim() || title.trim().length > 200 || !TASK_TYPES.includes(task_type) || !PRIORITIES.includes(priority) || !STATUSES.includes(status) || !validDate(due_date) || !validTime(due_time)) {
        return res.status(400).json({ message: 'One or more task fields are invalid.' });
      }
      // Changing a personal task into an organization task would require an
      // explicit organization association, so keep that state immutable here.
      if (task.task_type === 'ORG' !== (task_type === 'ORG')) {
        return res.status(400).json({ message: 'Task category cannot be changed to or from Organization Assigned.' });
      }
      if (task.organization_id && assigned_to && !(await isOrganizationMember(assigned_to, task.organization_id))) {
        return res.status(400).json({ message: 'The assignee must be a member of this organization.' });
      }

      await run(
        `UPDATE tasks 
         SET title = ?, description = ?, task_type = ?, due_date = ?, due_time = ?, priority = ?, status = ?, assigned_to = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [title.trim(), typeof description === 'string' ? description : '', task_type, due_date, due_time || null, priority, status, assigned_to || null, taskId]
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
      task: updatedTask
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

module.exports = router;
