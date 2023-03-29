import { Admin } from "./models/admin.js";
import { Customer } from "./models/customer.js";
import { LowLevel } from "./models/lowLevel.js";
import { MidLevel } from "./models/midLevel.js";
import { Order } from "./models/order.js";
import { Post } from "./models/post.js";
import { Product } from "./models/product.js";
import { Seller } from "./models/seller.js";
import { TopLevel } from "./models/topLevel.js";
import { Transaction } from "./models/transaction.js";

import dotenv from "dotenv";
import cloudinary from "cloudinary";

dotenv.config();

function omit(obj, ...props) {
  const result = { ...obj };
  props.forEach(function (prop) {
    delete result[prop];
  });
  return result;
}

// cloudinary.v2.config({
//   cloud_name: process.env.CLOUD_NAME,
//   api_key: process.env.API_KEY,
//   api_secret: process.env.API_SECRET,
// });

const resolvers = {
  Customer: {
    cart: async (parent, args) => {
      let cart = await Order.findOne({ customer: parent.id, status: "cart" });
      return cart;
    },
    old: async (parent, args) => {
      let oldPurchases = await Order.find({
        customer: parent.id,
        status: "old",
      });
      return oldPurchases;
    },
    packed: async (parent, args) => {
      let packed = await Order.find({
        customer: parent.id,
        status: "in_processing",
        packed: true,
        disbursed: false,
      });
      return packed;
    },
    awaitingPacking: async (parent, args) => {
      let awaitingPacking = await Order.find({
        customer: parent.id,
        status: "in_processing",
        packed: false,
        disbursed: false,
      });
      return awaitingPacking;
    },
  },

  Order: {
    products: async (parent, args) => {
      let o_products = parent.products;

      let _o_products = [];

      const getMeta = async (id) => {
        let meta = await Product.findById(id);
        return meta;
      };

      for (let i = 0; i < o_products.length; i++) {
        let _o_product = {
          id: o_products[i].id,
          meta: getMeta(o_products[i].prod_id),
          quantity: o_products[i].quantity,
        };

        _o_products.push(_o_product);
      }

      return _o_products;
    },
  },

  Query: {
    getAdmins: async (_, args) => {
      const admins = await Admin.find({});
      return admins;
    },
    getProducts: async (_, args) => {
      const { first, afterCursor, category } = args;

      if (!category) {
        let afterIndex = 0;
        const data = await Product.find({ removed: false }).sort({
          createdAt: "desc",
        });

        if (afterCursor) {
          let nodeIndex = data.findIndex((datum) => datum._id == afterCursor);
          console.log(nodeIndex);
          if (nodeIndex >= 0) {
            afterIndex = nodeIndex + 1;
          }
        }

        const slicedData = data.slice(afterIndex, afterIndex + first);
        const edges = slicedData.map((node) => ({
          node,
          cursor: node._id,
        }));

        let startCursor = null;
        if (edges.length > 0) {
          startCursor = edges[edges.length - 1].node.id;
        }
        let hasNextPage = data.length > afterIndex + first;

        return {
          totalCount: data.length,
          edges,
          pageInfo: {
            startCursor,
            hasNextPage,
          },
        };
      }
      if (category) {
        let afterIndex = 0;
        const data = await Product.find({ category }).sort({
          createdAt: "desc",
        });

        if (afterCursor) {
          let nodeIndex = data.findIndex((datum) => datum._id == afterCursor);
          console.log(nodeIndex);
          if (nodeIndex >= 0) {
            afterIndex = nodeIndex + 1;
          }
        }

        const slicedData = data.slice(afterIndex, afterIndex + first);
        const edges = slicedData.map((node) => ({
          node,
          cursor: node._id,
        }));

        let startCursor = null;
        if (edges.length > 0) {
          startCursor = edges[edges.length - 1].node.id;
        }
        let hasNextPage = data.length > afterIndex + first;

        return {
          totalCount: data.length,
          edges,
          pageInfo: {
            startCursor,
            hasNextPage,
          },
        };
      }
    },
    getAllProducts: async () => {
      let products = await Product.find({});
      return products.filter((product) => !product.removed);
    },
    getCustomers: async (_, args) => {
      let customers = await Customer.find();
      return customers;
    },
    getCustomer: async (_, args) => {
      let customer = await Customer.findById(args.id);
      return customer;
    },
    getOrders: async (_, args) => {
      let orders = await Order.find().populate("customer");
      return orders;
    },
  },

  Mutation: {
    addAdmin: async (_, args) => {
      const { username, password, telephone } = args;

      let newAdmin = new Admin({
        username,
        password,
        telephone,
      });

      let admin = newAdmin.save();
      return admin;
    },

    removeAdmin: async (_, { id }) => {
      await Admin.updateOne({ _id: id }, { removed: true });
      const admin = await Admin.findById(id);
      return admin;
    },

    changeAdminPassword: async (_, { id, password }) => {
      await Admin.updateOne({ _id: id }, { password });
      const admin = await Admin.findById(id);
      return admin;
    },

    addProduct: async (_, args) => {
      const {
        category,
        sale_start,
        sale_end,
        image,
        name,
        offer_price,
        price,
        quantity,
      } = args;

      cloudinary.v2.uploader
        .upload(image, {
          public_id: "",
          folder: "products",
        })
        .then((res) => {
          console.log(res.url);
          let newProduct = new Product({
            category,
            sale_start,
            sale_end,
            image: res.url,
            name,
            offer_price,
            price,
            quantity,
          });

          let product = newProduct.save();
          return product;
        })
        .catch((err) => {
          return null;
        });
    },
    addCustomer: async (_, args) => {
      const { displayName, email, location, phoneNumber, photo } = args;

      let newCustomer = new Customer({
        displayName,
        email,
        location,
        phoneNumber,
        photo,
      });

      let customer = newCustomer.save();
      return customer;
    },
    updateCustomer: async (_, args) => {
      await Customer.updateOne({ _id: args.id }, omit(args, args.id));
      let customer = await Customer.findById(args.id);
      return customer;
    },
    updateProduct: async (_, args) => {
      await Product.updateOne({ _id: args.id }, omit(args, args.id));

      let product = await Product.findById(args.id);
      product.SyncToAlgolia();
      return product;
    },
    addToCart: async (_, args) => {
      const { customer, prod_id, quantity } = args;

      let cart = await Order.find({ status: "cart", customer });

      if (cart.length == 1) {
        await Order.updateOne(
          { _id: cart[0].id },
          {
            $addToSet: {
              products: {
                prod_id,
                quantity,
              },
            },
          }
        );
        let order = await Order.findById(cart[0].id);
        return order;
      } else {
        let newOrder = new Order({
          status: "cart",
          customer,
          products: [
            {
              prod_id,
              quantity,
            },
          ],
        });

        let order = newOrder.save();
        return order;
      }
    },
    updateCart: async (_, args) => {
      const { action, prod_id, customer } = args;

      switch (action) {
        case "increment":
          await Order.updateOne(
            { status: "cart", customer, "products.prod_id": prod_id },
            {
              $inc: { "products.$.quantity": 1 },
            }
          );
          let order1 = await Order.findOne({ status: "cart", customer });
          return order1;

        case "decrement":
          await Order.updateOne(
            { status: "cart", customer, "products.prod_id": prod_id },
            {
              $inc: { "products.$.quantity": -1 },
            }
          );
          let order2 = await Order.findOne({ status: "cart", customer });
          return order2;

        case "remove":
          await Order.updateOne(
            { status: "cart", customer },
            {
              $pull: { products: { prod_id } },
            }
          );
          let order3 = await Order.findOne({ status: "cart", customer });
          return order3;

        default:
          return;
      }
    },
    updateOrder: async (_, args) => {
      const { ref, amount, timestamp, id } = args;

      await Order.updateOne(
        { _id: id },
        omit(args, [ref, amount, timestamp, id])
      );

      if (ref && amount && timestamp) {
        await Order.updateOne(
          { _id: id },
          {
            payment: {
              timestamp,
              ref,
              amount,
            },
          }
        );
      }

      let order = await Order.findById(id);
      return order;
    },
  },
};

export default resolvers;
