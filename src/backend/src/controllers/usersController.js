const { PrismaClient } = require('@prisma/client');

// Try to use bcrypt, fallback to bcryptjs if not available
let bcrypt;
try {
  bcrypt = require('bcrypt');
  console.log('✅ Using bcrypt for password hashing');
} catch (error) {
  bcrypt = require('bcryptjs');
  console.log('⚠️  bcrypt not found, using bcryptjs fallback');
}

const prisma = new PrismaClient();

// Helper function to exclude password from user object
const excludePassword = (user) => {
  if (!user) return null;
  const { password_hash, two_factor_secret, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    console.log('📋 Fetching all users...');
    
    const users = await prisma.$queryRaw`
      SELECT 
        id,
        username,
        email,
        full_name,
        phone,
        role,
        status,
        department,
        position,
        avatar_url,
        bio,
        last_login,
        failed_login_attempts,
        password_changed_at,
        two_factor_enabled,
        created_at,
        updated_at,
        deleted_at,
        (SELECT full_name FROM users u2 WHERE u2.id = users.created_by) as created_by_name,
        (SELECT full_name FROM users u3 WHERE u3.id = users.updated_by) as updated_by_name
      FROM users 
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `;

    console.log(`✅ Found ${users.length} users`);
    
    res.json({
      success: true,
      data: users,
      total: users.length
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`👤 Fetching user by ID: ${id}`);
    
    const user = await prisma.$queryRaw`
      SELECT 
        id,
        username,
        email,
        full_name,
        phone,
        role,
        status,
        department,
        position,
        avatar_url,
        bio,
        last_login,
        failed_login_attempts,
        password_changed_at,
        two_factor_enabled,
        permissions,
        settings,
        created_at,
        updated_at,
        (SELECT full_name FROM users u2 WHERE u2.id = users.created_by) as created_by_name
      FROM users 
      WHERE id = ${id}::uuid AND deleted_at IS NULL
    `;

    if (!user || user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`✅ User found: ${user[0].username}`);
    
    res.json({
      success: true,
      data: user[0]
    });
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      full_name,
      phone,
      role = 'staff',
      department,
      position,
      bio
    } = req.body;

    console.log(`➕ Creating new user: ${username}`);

    // Validate required fields
    if (!username || !email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, password, and full name are required'
      });
    }

    // Validate role
    if (!['admin', 'manager', 'staff'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be admin, manager, or staff'
      });
    }

    // Check if username or email already exists
    const existingUser = await prisma.$queryRaw`
      SELECT id FROM users 
      WHERE (username = ${username} OR email = ${email}) 
      AND deleted_at IS NULL
    `;

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await prisma.$queryRaw`
      INSERT INTO users (
        username, 
        email, 
        password_hash, 
        full_name, 
        phone, 
        role, 
        department, 
        position, 
        bio,
        created_by
      ) VALUES (
        ${username},
        ${email},
        ${password_hash},
        ${full_name},
        ${phone || null},
        ${role},
        ${department || null},
        ${position || null},
        ${bio || null},
        ${req.user?.id || null}::uuid
      ) RETURNING 
        id, username, email, full_name, phone, role, status, 
        department, position, bio, created_at
    `;

    console.log(`✅ User created successfully: ${username}`);

    // Log activity
    if (req.user?.id) {
      await prisma.$queryRaw`
        INSERT INTO user_activity_logs (user_id, action, resource, resource_id, details)
        VALUES (
          ${req.user.id}::uuid,
          'CREATE_USER',
          'users',
          ${newUser[0].id}::uuid,
          ${JSON.stringify({ username, role, full_name })}::jsonb
        )
      `;
    }

    res.status(201).json({
      success: true,
      data: newUser[0],
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      username,
      email,
      full_name,
      phone,
      role,
      status,
      department,
      position,
      bio
    } = req.body;

    console.log(`✏️ Updating user: ${id}`);

    // Check if user exists
    const existingUser = await prisma.$queryRaw`
      SELECT id, username, email FROM users 
      WHERE id = ${id}::uuid AND deleted_at IS NULL
    `;

    if (!existingUser || existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate role if provided
    if (role && !['admin', 'manager', 'staff'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be admin, manager, or staff'
      });
    }

    // Validate status if provided
    if (status && !['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, inactive, or suspended'
      });
    }

    // Check for username/email conflicts (excluding current user)
    if (username || email) {
      const conflicts = await prisma.$queryRaw`
        SELECT id FROM users 
        WHERE (username = ${username || existingUser[0].username} OR email = ${email || existingUser[0].email}) 
        AND id != ${id}::uuid 
        AND deleted_at IS NULL
      `;

      if (conflicts.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Username or email already exists'
        });
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const values = [];
    
    if (username) {
      updateFields.push(`username = $${updateFields.length + 1}`);
      values.push(username);
    }
    if (email) {
      updateFields.push(`email = $${updateFields.length + 1}`);
      values.push(email);
    }
    if (full_name) {
      updateFields.push(`full_name = $${updateFields.length + 1}`);
      values.push(full_name);
    }
    if (phone !== undefined) {
      updateFields.push(`phone = $${updateFields.length + 1}`);
      values.push(phone);
    }
    if (role) {
      updateFields.push(`role = $${updateFields.length + 1}`);
      values.push(role);
    }
    if (status) {
      updateFields.push(`status = $${updateFields.length + 1}`);
      values.push(status);
    }
    if (department !== undefined) {
      updateFields.push(`department = $${updateFields.length + 1}`);
      values.push(department);
    }
    if (position !== undefined) {
      updateFields.push(`position = $${updateFields.length + 1}`);
      values.push(position);
    }
    if (bio !== undefined) {
      updateFields.push(`bio = $${updateFields.length + 1}`);
      values.push(bio);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    // Add updated_by and updated_at
    updateFields.push(`updated_by = $${updateFields.length + 1}`);
    values.push(req.user?.id || null);
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add WHERE clause
    values.push(id);

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${values.length}::uuid
      RETURNING 
        id, username, email, full_name, phone, role, status,
        department, position, bio, updated_at
    `;

    const updatedUser = await prisma.$queryRawUnsafe(query, ...values);

    console.log(`✅ User updated successfully: ${id}`);

    // Log activity
    if (req.user?.id) {
      await prisma.$queryRaw`
        INSERT INTO user_activity_logs (user_id, action, resource, resource_id, details)
        VALUES (
          ${req.user.id}::uuid,
          'UPDATE_USER',
          'users',
          ${id}::uuid,
          ${JSON.stringify(req.body)}::jsonb
        )
      `;
    }

    res.json({
      success: true,
      data: updatedUser[0],
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

// Change user password
const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { current_password, new_password } = req.body;

    console.log(`🔑 Changing password for user: ${id}`);

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get current user
    const user = await prisma.$queryRaw`
      SELECT id, password_hash FROM users 
      WHERE id = ${id}::uuid AND deleted_at IS NULL
    `;

    if (!user || user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(current_password, user[0].password_hash);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 10;
    const new_password_hash = await bcrypt.hash(new_password, saltRounds);

    // Update password
    await prisma.$queryRaw`
      UPDATE users 
      SET 
        password_hash = ${new_password_hash},
        password_changed_at = CURRENT_TIMESTAMP,
        failed_login_attempts = 0,
        updated_by = ${req.user?.id || null}::uuid
      WHERE id = ${id}::uuid
    `;

    console.log(`✅ Password changed successfully for user: ${id}`);

    // Log activity
    if (req.user?.id) {
      await prisma.$queryRaw`
        INSERT INTO user_activity_logs (user_id, action, resource, resource_id)
        VALUES (
          ${req.user.id}::uuid,
          'CHANGE_PASSWORD',
          'users',
          ${id}::uuid
        )
      `;
    }

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('❌ Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

// Delete user (soft delete)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Soft deleting user: ${id}`);

    // Check if user exists
    const user = await prisma.$queryRaw`
      SELECT id, username, role FROM users 
      WHERE id = ${id}::uuid AND deleted_at IS NULL
    `;

    if (!user || user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting the last admin
    if (user[0].role === 'admin') {
      const adminCount = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM users 
        WHERE role = 'admin' AND deleted_at IS NULL
      `;

      if (parseInt(adminCount[0].count) <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last admin user'
        });
      }
    }

    // Soft delete user
    await prisma.$queryRaw`
      UPDATE users 
      SET 
        deleted_at = CURRENT_TIMESTAMP,
        deleted_by = ${req.user?.id || null}::uuid,
        status = 'inactive'
      WHERE id = ${id}::uuid
    `;

    console.log(`✅ User soft deleted successfully: ${id}`);

    // Log activity
    if (req.user?.id) {
      await prisma.$queryRaw`
        INSERT INTO user_activity_logs (user_id, action, resource, resource_id, details)
        VALUES (
          ${req.user.id}::uuid,
          'DELETE_USER',
          'users',
          ${id}::uuid,
          ${JSON.stringify({ username: user[0].username, role: user[0].role })}::jsonb
        )
      `;
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    console.log('📊 Fetching user statistics...');
    
    const stats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) FILTER (WHERE deleted_at IS NULL) as total_users,
        COUNT(*) FILTER (WHERE role = 'admin' AND deleted_at IS NULL) as total_admins,
        COUNT(*) FILTER (WHERE role = 'manager' AND deleted_at IS NULL) as total_managers,
        COUNT(*) FILTER (WHERE role = 'staff' AND deleted_at IS NULL) as total_staff,
        COUNT(*) FILTER (WHERE status = 'active' AND deleted_at IS NULL) as active_users,
        COUNT(*) FILTER (WHERE status = 'inactive' AND deleted_at IS NULL) as inactive_users,
        COUNT(*) FILTER (WHERE status = 'suspended' AND deleted_at IS NULL) as suspended_users,
        COUNT(*) FILTER (WHERE last_login >= CURRENT_DATE - INTERVAL '7 days' AND deleted_at IS NULL) as recent_logins
      FROM users
    `;

    console.log('✅ User statistics fetched successfully');
    
    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('❌ Error fetching user statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message
    });
  }
};

// Get user activity logs
const getUserActivityLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    console.log(`📜 Fetching activity logs for user: ${id}`);
    
    const logs = await prisma.$queryRaw`
      SELECT 
        ual.*,
        u.full_name as user_name
      FROM user_activity_logs ual
      LEFT JOIN users u ON u.id = ual.user_id
      WHERE ual.resource_id = ${id}::uuid OR ual.user_id = ${id}::uuid
      ORDER BY ual.created_at DESC
      LIMIT ${parseInt(limit)}
      OFFSET ${parseInt(offset)}
    `;

    console.log(`✅ Found ${logs.length} activity logs`);
    
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('❌ Error fetching activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  changePassword,
  deleteUser,
  getUserStats,
  getUserActivityLogs
};