/**
 * Models Index
 * 
 * This file defines and exports all Sequelize models for the application.
 * It also sets up associations between models.
 */

const { DataTypes } = require('sequelize');
const { sequelize, Vector } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Define models
const Organisation = sequelize.define('Organisation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: () => uuidv4(),
    primaryKey: true
  },
  name: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'organisations',
  underscored: true,
  timestamps: true
});

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: () => uuidv4(),
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true // Null if using OAuth
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('owner', 'admin', 'editor', 'viewer'),
    allowNull: false,
    defaultValue: 'viewer'
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resetToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetTokenExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  underscored: true,
  timestamps: true
});

const Folder = sequelize.define('Folder', {
  id: {
    type: DataTypes.UUID,
    defaultValue: () => uuidv4(),
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'folders',
  underscored: true,
  timestamps: true
});

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.UUID,
    defaultValue: () => uuidv4(),
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mime: {
    type: DataTypes.STRING,
    allowNull: false
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  storagePath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'ready', 'error'),
    defaultValue: 'ready'
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  orgId: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  tableName: 'documents',
  underscored: true,
  timestamps: true,
  paranoid: true, // Soft deletes
  indexes: [
    {
      fields: ['orgId']
    },
    {
      fields: ['uploadedById']
    },
    {
      fields: ['folderId']
    }
  ]
});

const Chunk = sequelize.define('Chunk', {
  id: {
    type: DataTypes.UUID,
    defaultValue: () => uuidv4(),
    primaryKey: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  page: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  tokenCount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  startIndex: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  endIndex: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  embedding: {
    type: DataTypes.STRING,
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'chunks',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      fields: ['documentId']
    },
    {
      name: 'chunks_embedding_idx',
      using: 'ivfflat',
      fields: ['embedding'],
      operator: 'vector_cosine_ops',
      concurrently: false
    }
  ]
});

const Thread = sequelize.define('Thread', {
  id: {
    type: DataTypes.UUID,
    defaultValue: () => uuidv4(),
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'threads',
  underscored: true,
  timestamps: true
});

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: () => uuidv4(),
    primaryKey: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('user', 'assistant', 'system'),
    allowNull: false
  },
  citations: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'messages',
  underscored: true,
  timestamps: true
});

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  meta: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'audit_logs',
  underscored: true,
  timestamps: true,
  updatedAt: false
});

// Define associations
Organisation.hasMany(User, { foreignKey: 'orgId' });
User.belongsTo(Organisation, { foreignKey: 'orgId' });

Organisation.hasMany(Folder, { foreignKey: 'orgId' });
Folder.belongsTo(Organisation, { foreignKey: 'orgId' });

Folder.hasMany(Folder, { as: 'subfolders', foreignKey: 'parentId' });
Folder.belongsTo(Folder, { as: 'parent', foreignKey: 'parentId' });

Organisation.hasMany(Document, { foreignKey: 'orgId' });
Document.belongsTo(Organisation, { foreignKey: 'orgId' });

Folder.hasMany(Document, { foreignKey: 'folderId' });
Document.belongsTo(Folder, { foreignKey: 'folderId' });

User.hasMany(Document, { foreignKey: 'uploadedById' });
Document.belongsTo(User, { as: 'uploadedBy', foreignKey: 'uploadedById' });

Document.hasMany(Chunk, { foreignKey: 'documentId' });
Chunk.belongsTo(Document, { foreignKey: 'documentId' });

Organisation.hasMany(Thread, { foreignKey: 'orgId' });
Thread.belongsTo(Organisation, { foreignKey: 'orgId' });

User.hasMany(Thread, { foreignKey: 'userId' });
Thread.belongsTo(User, { foreignKey: 'userId' });

Thread.hasMany(Message, { foreignKey: 'threadId' });
Message.belongsTo(Thread, { foreignKey: 'threadId' });

Organisation.hasMany(AuditLog, { foreignKey: 'orgId' });
AuditLog.belongsTo(Organisation, { foreignKey: 'orgId' });

User.hasMany(AuditLog, { foreignKey: 'userId' });
AuditLog.belongsTo(User, { foreignKey: 'userId' });

// Export models
module.exports = {
  sequelize,
  Organisation,
  User,
  Folder,
  Document,
  Chunk,
  Thread,
  Message,
  AuditLog
};
