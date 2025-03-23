const productDao = require('../models/dao/productDao');
const Minio = require('minio');
const fs = require('fs');
const path = require('path');

const minioClient = new Minio.Client({
  endPoint: '47.239.72.7',
  port: 9001,
  useSSL: false,
  accessKey: 'admin',
  secretKey: 'admin123'
});

module.exports = {
  /**
   * Get product categories
   * @param {Object} ctx
   */
  GetCategory: async ctx => {
    const category = await productDao.GetCategory();

    ctx.body = {
      code: '001',
      category
    }
  },
  /**
   * Get promotional product information based on category name
   * @param {Object} ctx
   */
  GetPromoProduct: async ctx => {
    let { categoryName } = ctx.request.body;
    // Get category ID based on category name
    const categoryID = await productDao.GetCategoryId(categoryName);
    // Get promotional product information based on category ID
    const Product = await productDao.GetPromoProduct(categoryID);

    ctx.body = {
      code: '001',
      Product
    }
  },
  /**
   * Get hot product information based on category name
   * @param {Object} ctx
   */
  GetHotProduct: async ctx => {
    let { categoryName } = ctx.request.body;
    const categoryID = [];

    for (let i = 0; i < categoryName.length; i++) {
      // Get category ID based on category name
      const category_id = await productDao.GetCategoryId(categoryName[i]);
      categoryID.push(category_id);
    }
    // Get product information based on category ID
    const Product = await productDao.GetProductByCategory(categoryID, 0, 7);

    ctx.body = {
      code: '001',
      Product
    }
  },
  /**
   * Paginate and get all product information
   * @param {Object} ctx
   */
  GetAllProduct: async ctx => {
    let { currentPage, pageSize } = ctx.request.body;
    // Calculate the starting index
    const offset = (currentPage - 1) * pageSize;
    const Product = await productDao.GetAllProduct(offset, pageSize);
    // Get the total number of products for pagination calculation on the frontend
    const total = (await productDao.GetAllProduct()).length;
    ctx.body = {
      code: '001',
      Product,
      total
    }
  },
  /**
   * Paginate and get product information based on category ID
   * @param {Object} ctx
   */
  GetProductByCategory: async ctx => {
    let { categoryID, currentPage, pageSize } = ctx.request.body;
    // Calculate the starting index
    const offset = (currentPage - 1) * pageSize;
    // Paginate and get product information for the category
    const Product = await productDao.GetProductByCategory(categoryID, offset, pageSize);
    // Get the total number of products for the category for pagination calculation on the frontend
    const total = (await productDao.GetProductByCategory(categoryID)).length;

    ctx.body = {
      code: '001',
      Product,
      total
    }
  },
  /**
   * Paginate and get product information based on search criteria
   * @param {Object} ctx
   */
  GetProductBySearch: async ctx => {
    let { search, currentPage, pageSize } = ctx.request.body;
    // Calculate the starting index
    const offset = (currentPage - 1) * pageSize;
    // Get the category list
    const category = await productDao.GetCategory();

    let Product;
    let total;

    for (let i = 0; i < category.length; i++) {
      // If the search criteria match a category name, directly return the products for that category
      if (search == category[i].category_name) {
        // Get the products for the category
        Product = await productDao.GetProductByCategory(category[i].category_id, offset, pageSize);
        // Get the total number of products for the category for pagination calculation on the frontend
        total = (await productDao.GetProductByCategory(category[i].category_id)).length;

        ctx.body = {
          code: '001',
          Product,
          total
        }
        return;
      }
    }
    // Otherwise, return the paginated results of products based on fuzzy search
    Product = await productDao.GetProductBySearch(search, offset, pageSize);
    // Get the total number of products for the fuzzy search
    total = (await productDao.GetProductBySearch(search)).length;

    ctx.body = {
      code: '001',
      Product,
      total
    }
  },
  /**
   * Get detailed product information based on product ID
   * @param {Object} ctx
   */
  GetDetails: async ctx => {
    let { productID } = ctx.request.body;

    const Product = await productDao.GetProductById(productID);

    ctx.body = {
      code: '001',
      Product,
    }
  },
  /**
   * Get product images based on product ID for product detail page display
   * @param {Object} ctx
   */
  GetDetailsPicture: async ctx => {
    let { productID } = ctx.request.body;

    const ProductPicture = await productDao.GetDetailsPicture(productID);

    ctx.body = {
      code: '001',
      ProductPicture,
    }
  },
  CreateProduct: async ctx => {
    const { catid, name, title, intro, price, selling_price, num } = ctx.request.body;
    const file = ctx.request.files?.image; // Get the uploaded file

    if (!file) {
      ctx.body = { code: '002', message: 'The image file cannot be empty' };
      return;
    }

    const fileStream = fs.createReadStream(file.path);
    const fileName = `${Date.now()}_${path.basename(file.name)}`;
    const bucketName = 'mall-images';
    const categoryName = await productDao.GetCategoryName(catid);
    const objectName =  categoryName + '/' + fileName;

    try {
      // Upload the image to MinIO
      await minioClient.putObject(bucketName, objectName, fileStream);
      const imageUrl = `http://47.239.72.7:9001/${bucketName}/${objectName}`;

      // Save to the database
      const result = await productDao.CreateProduct({
        catid, name, title, intro, price, selling_price, num, imageUrl
      });

      ctx.body = { code: '001', message: 'Product created successfully', productId: result.insertId };
    } catch (error) {
      ctx.body = { code: '003', message: 'Product creation failed', error };
    }
  },
  CreateCategory: async ctx => {
    const { catName } = ctx.request.body;

    if (!catName) {
      ctx.body = { code: '002', message: 'Category name should not be empty!' };
      return;
    }

    try {
      const result = await productDao.CreateCategory(catName);
      ctx.body = { code: '001', message: 'Category created successfully', categoryId: result.insertId };
    } catch (error) {
      ctx.body = { code: '003', message: 'Category creation failed', error };
    }
  }
}