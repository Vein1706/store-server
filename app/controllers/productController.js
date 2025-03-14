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
   * 获取商品分类
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
   * 根据商品分类名称获取首页展示的商品信息
   * @param {Object} ctx
   */
  GetPromoProduct: async ctx => {
    let { categoryName } = ctx.request.body;
    // 根据商品分类名称获取分类id
    const categoryID = await productDao.GetCategoryId(categoryName);
    // 根据商品分类id获取首页展示的商品信息
    const Product = await productDao.GetPromoProduct(categoryID);

    ctx.body = {
      code: '001',
      Product
    }
  },
  /**
   * 根据商品分类名称获取热门商品信息
   * @param {Object} ctx
   */
  GetHotProduct: async ctx => {
    let { categoryName } = ctx.request.body;
    const categoryID = [];

    for (let i = 0; i < categoryName.length; i++) {
      // 根据商品分类名称获取分类id
      const category_id = await productDao.GetCategoryId(categoryName[i]);
      categoryID.push(category_id);
    }
    // 根据商品分类id获取商品信息
    const Product = await productDao.GetProductByCategory(categoryID, 0, 7);

    ctx.body = {
      code: '001',
      Product
    }
  },
  /**
   * 分页获取所有的商品信息
   * @param {Object} ctx
   */
  GetAllProduct: async ctx => {
    let { currentPage, pageSize } = ctx.request.body;
    // 计算开始索引
    const offset = (currentPage - 1) * pageSize;
    const Product = await productDao.GetAllProduct(offset, pageSize);
    // 获取所有的商品数量,用于前端分页计算
    const total = (await productDao.GetAllProduct()).length;
    ctx.body = {
      code: '001',
      Product,
      total
    }
  },
  /**
   * 根据分类id,分页获取商品信息
   * @param {Object} ctx
   */
  GetProductByCategory: async ctx => {
    let { categoryID, currentPage, pageSize } = ctx.request.body;
    // 计算开始索引
    const offset = (currentPage - 1) * pageSize;
    // 分页获取该分类的商品信息
    const Product = await productDao.GetProductByCategory(categoryID, offset, pageSize);
    // 获取该分类所有的商品数量,用于前端分页计算
    const total = (await productDao.GetProductByCategory(categoryID)).length;

    ctx.body = {
      code: '001',
      Product,
      total
    }
  },
  /**
   * 根据搜索条件,分页获取商品信息
   * @param {Object} ctx
   */
  GetProductBySearch: async ctx => {
    let { search, currentPage, pageSize } = ctx.request.body;
    // 计算开始索引
    const offset = (currentPage - 1) * pageSize;
    // 获取分类列表
    const category = await productDao.GetCategory();

    let Product;
    let total;

    for (let i = 0; i < category.length; i++) {
      // 如果搜索条件为某个分类名称,直接返回该分类的商品信息
      if (search == category[i].category_name) {
        // 获取该分类的商品信息
        Product = await productDao.GetProductByCategory(category[i].category_id, offset, pageSize);
        // 获取该分类所有的商品数量,用于前端分页计算
        total = (await productDao.GetProductByCategory(category[i].category_id)).length;

        ctx.body = {
          code: '001',
          Product,
          total
        }
        return;
      }
    }
    // 否则返回根据查询条件模糊查询的商品分页结果
    Product = await productDao.GetProductBySearch(search, offset, pageSize);
    // 获取模糊查询的商品结果总数
    total = (await productDao.GetProductBySearch(search)).length;

    ctx.body = {
      code: '001',
      Product,
      total
    }
  },
  /**
   * 根据商品id,获取商品详细信息
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
   * 根据商品id,获取商品图片,用于食品详情的页面展示
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
    const file = ctx.request.files?.image; // 获取上传的文件

    if (!file) {
      ctx.body = { code: '002', message: '图片文件不能为空' };
      return;
    }

    const fileStream = fs.createReadStream(file.path);
    const fileName = `${Date.now()}_${path.basename(file.name)}`;
    const bucketName = 'mall-images';
    const objectName = fileName;

    try {
      // 上传图片到 MinIO
      await minioClient.putObject(bucketName, objectName, fileStream);
      const imageUrl = `http://47.239.72.7:9001/${bucketName}/${objectName}`;

      // 存入数据库
      const result = await productDao.CreateProduct({
        catid, name, title, intro, price, selling_price, num, imageUrl
      });

      ctx.body = { code: '001', message: 'product created succeed', productId: result.insertId };
    } catch (error) {
      ctx.body = { code: '003', message: 'product created failed', error };
    }
  },
  CreateCategory: async ctx => {
    const { catName } = ctx.request.body;

    if (!catName) {
      ctx.body = { code: '002', message: 'catName should not be empty!' };
      return;
    }

    try {
      const result = await productDao.CreateCategory(catName);
      ctx.body = { code: '001', message: 'category created succeed', categoryId: result.insertId };
    } catch (error) {
      ctx.body = { code: '003', message: 'category created failed', error };
    }
  }
}