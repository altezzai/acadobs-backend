"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("schools", "upi_id", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("schools", "upi_name", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("schools", "payment_enabled", {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });
    await queryInterface.addColumn("schools", "slug", {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("schools", "short_name", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("schools", "tagline", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("schools", "about", {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("schools", "description", {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("schools", "website", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("schools", "whatsapp", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("schools", "alternate_phone", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("schools", "pincode", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("schools", "district", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("schools", "state", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("schools", "google_map_url", {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("schools", "facebook_url", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("schools", "instagram_url", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("schools", "youtube_url", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("schools", "admission_enabled", {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });
    await queryInterface.addColumn("schools", "seo_title", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("schools", "seo_description", {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("schools", "payment_section", {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });
    await queryInterface.addColumn("schools", "transpotation_section", {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });
    await queryInterface.addColumn("schools", "ai_section", {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("schools", "upi_id");
    await queryInterface.removeColumn("schools", "upi_name");
    await queryInterface.removeColumn("schools", "payment_enabled");
    await queryInterface.removeColumn("schools", "slug");
    await queryInterface.removeColumn("schools", "short_name");
    await queryInterface.removeColumn("schools", "tagline");
    await queryInterface.removeColumn("schools", "about");
    await queryInterface.removeColumn("schools", "description");
    await queryInterface.removeColumn("schools", "website");
    await queryInterface.removeColumn("schools", "whatsapp");
    await queryInterface.removeColumn("schools", "alternate_phone");
    await queryInterface.removeColumn("schools", "pincode");
    await queryInterface.removeColumn("schools", "district");
    await queryInterface.removeColumn("schools", "state");
    await queryInterface.removeColumn("schools", "google_map_url");
    await queryInterface.removeColumn("schools", "facebook_url");
    await queryInterface.removeColumn("schools", "instagram_url");
    await queryInterface.removeColumn("schools", "youtube_url");
    await queryInterface.removeColumn("schools", "admission_enabled");
    await queryInterface.removeColumn("schools", "seo_title");
    await queryInterface.removeColumn("schools", "seo_description");
    await queryInterface.removeColumn("schools", "payment_section");
    await queryInterface.removeColumn("schools", "transpotation_section");
    await queryInterface.removeColumn("schools", "ai_section");
  },
};
