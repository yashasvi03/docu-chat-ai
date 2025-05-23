/**
 * Document Model
 * 
 * Sequelize model for documents in PostgreSQL
 */

const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
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

  Document.associate = (models) => {
    Document.belongsTo(models.User, {
      foreignKey: 'uploadedById',
      as: 'uploadedBy'
    });
    
    Document.belongsTo(models.Folder, {
      foreignKey: 'folderId',
      as: 'folder'
    });
    
    Document.belongsTo(models.Organisation, {
      foreignKey: 'orgId',
      as: 'organisation'
    });
    
    Document.hasMany(models.Chunk, {
      foreignKey: 'documentId',
      as: 'chunks'
    });
  };

  return Document;
};
