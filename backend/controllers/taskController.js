const Task = require('../models/Task');
const Employee = require('../models/Employee');

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private (Admin, Manager)
const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, startDate, dueDate, project } = req.body;

    if (!title || !assignedTo || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Title, assigned employee, and due date are required.',
      });
    }

    const task = await Task.create({
      title,
      description: description || '',
      assignedTo,
      assignedBy: req.user._id,
      priority: priority || 'Medium',
      startDate: startDate || Date.now(),
      dueDate: new Date(dueDate),
      project: project || null,
      status: 'Pending',
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email employeeId designation department profileImage')
      .populate('assignedBy', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      task: populatedTask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create task.',
      error: error.message,
    });
  }
};

// @desc    Get tasks (filtered by user role)
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const { status, priority } = req.query;
    let query = {};

    if (status && status !== 'All') query.status = status;
    if (priority && priority !== 'All') query.priority = priority;

    if (req.user.role === 'employee') {
      const employee = await Employee.findOne({
        $or: [{ user: req.user._id }, { email: req.user.email }],
      });
      if (!employee) {
        return res.status(200).json({ success: true, tasks: [] });
      }
      query.assignedTo = employee._id;
    } else if (req.user.role === 'manager') {
      // Manager sees tasks they assigned OR tasks assigned to their team members
      const teamEmployees = await Employee.find({ manager: req.user._id }).select('_id');
      const teamIds = teamEmployees.map((e) => e._id);
      query.$or = [{ assignedBy: req.user._id }, { assignedTo: { $in: teamIds } }];
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email employeeId designation department profileImage')
      .populate('assignedBy', 'name email role')
      .populate('project', 'projectName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks.',
      error: error.message,
    });
  }
};

// @desc    Update task (status or details)
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
    }

    // If employee is updating, they can only update status
    if (req.user.role === 'employee') {
      const employee = await Employee.findOne({
        $or: [{ user: req.user._id }, { email: req.user.email }],
      });
      if (!employee || task.assignedTo.toString() !== employee._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only update tasks assigned to you.',
        });
      }

      if (req.body.status) task.status = req.body.status;
      await task.save();
    } else {
      // Admin and Manager can update all fields & feedback
      const allowedUpdates = [
        'title',
        'description',
        'assignedTo',
        'priority',
        'startDate',
        'dueDate',
        'status',
        'feedback',
        'project',
      ];
      allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) {
          task[field] = req.body[field];
        }
      });
      await task.save();
    }

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email employeeId designation department profileImage')
      .populate('assignedBy', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      task: updatedTask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update task.',
      error: error.message,
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin, Manager)
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete task.',
      error: error.message,
    });
  }
};

module.exports = {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
};
