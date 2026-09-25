const Project = require('../models/Project');
const Employee = require('../models/Employee');

// @desc    Get projects
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'manager') {
      query.manager = req.user._id;
    } else if (req.user.role === 'employee') {
      const employee = await Employee.findOne({
        $or: [{ user: req.user._id }, { email: req.user.email }],
      });
      if (employee) {
        query.teamMembers = employee._id;
      }
    }

    const projects = await Project.find(query)
      .populate('manager', 'name email employeeId')
      .populate('teamMembers', 'name email employeeId designation department profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects.',
      error: error.message,
    });
  }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private (Admin, Manager)
const createProject = async (req, res) => {
  try {
    const { projectName, description, manager, teamMembers, startDate, deadline, status, progress } = req.body;

    if (!projectName || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Project name and deadline are required.',
      });
    }

    const project = await Project.create({
      projectName,
      description: description || '',
      manager: manager || req.user._id,
      teamMembers: teamMembers || [],
      startDate: startDate || Date.now(),
      deadline: new Date(deadline),
      status: status || 'In Progress',
      progress: progress || 0,
    });

    const populated = await Project.findById(project._id)
      .populate('manager', 'name email')
      .populate('teamMembers', 'name email employeeId');

    res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      project: populated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create project.',
      error: error.message,
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin, Manager)
const updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('manager', 'name email')
      .populate('teamMembers', 'name email employeeId');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Project updated successfully.',
      project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update project.',
      error: error.message,
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin)
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete project.',
      error: error.message,
    });
  }
};

module.exports = {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
};
