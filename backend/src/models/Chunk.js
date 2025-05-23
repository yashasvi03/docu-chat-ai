/**
 * Chunk Model
 * 
 * Sequelize model for document chunks with vector embeddings in PostgreSQL
 */

const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
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
      type: DataTypes.VECTOR(1536), // Using pgvector extension
      allowNull: false
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
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

  Chunk.associate = (models) => {
    Chunk.belongsTo(models.Document, {
      foreignKey: 'documentId',
      as: 'document',
      onDelete: 'CASCADE'
    });
  };

  // Add method to find similar chunks
  Chunk.findSimilar = async function(embedding, options = {}) {
    const {
      limit = 5,
      threshold = 0.25,
      documentIds = null,
      orgId = null
    } = options;

    // Build the query
    let query = `
      SELECT 
        "Chunks".*, 
        "Documents"."title" as "documentTitle",
        1 - ("Chunks"."embedding" <=> ?) as "similarity"
      FROM "Chunks"
      INNER JOIN "Documents" ON "Chunks"."documentId" = "Documents"."id"
      WHERE 1 - ("Chunks"."embedding" <=> ?) >= ?
    `;

    const queryParams = [embedding, embedding, threshold];

    // Add document filter if provided
    if (documentIds && documentIds.length > 0) {
      query += ` AND "Chunks"."documentId" IN (?)`;
      queryParams.push(documentIds);
    }

    // Add organization filter if provided
    if (orgId) {
      query += ` AND "Documents"."orgId" = ?`;
      queryParams.push(orgId);
    }

    // Add order and limit
    query += `
      ORDER BY "similarity" DESC
      LIMIT ?
    `;
    queryParams.push(limit);

    // Execute the query
    const [results] = await sequelize.query(query, {
      replacements: queryParams,
      type: sequelize.QueryTypes.SELECT,
      raw: true
    });

    return results;
  };

  return Chunk;
};
