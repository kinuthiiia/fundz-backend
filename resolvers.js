import { Account } from "./models/account.js";
import { Saving } from "./models/saving.js";
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

function getUnique(value, index, array) {
  return self.indexOf(value) === index;
}

cloudinary.v2.config({
  cloud_name: "dxjhcfinq",
  api_key: "292858742431259",
  api_secret: "os1QzAVfEfifsaRgMvsXEfXlPws",
});

const resolvers = {
  Query: {
    getFrontPage: async (_, args) => {
      const { account } = args;

      const month = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      let frontPage = async () => {
        const _account = await Account.findById(account);

        const recents = await Transaction.find()
          .sort({ createdAt: -1 })
          .limit(50);

        const savings = await Saving.find({ account }).sort({ createdAt: -1 });

        return {
          account: _account,
          month: month[new Date().getMonth()],
          year: new Date().getFullYear(),
          spend: 0,
          average: 0,
          dailys: null,
          recents,
          savings,
        };
      };

      return frontPage();
    },
    getAccountDetails: async (_, args) => {},
  },

  Mutation: {
    newTarget: async (_, args) => {
      const { name, target, color, account, reminder } = args;

      let newSaving = new Saving({
        name,
        target,
        color,
        account,
        reminder,
        amount: 0,
        status: "OPEN",
      });

      let saving = newSaving.save();
      return saving;
    },

    newTransaction: async (_, args) => {
      const { amount, tags, source, type, account } = args;

      if (source) {
        await Saving.updateOne(
          {
            id: source,
          },
          {
            $inc: { amount: -parseInt(amount) },
          }
        );
      }

      let newTransaction = new Transaction({
        amount,
        tags,
        source,
        type,
        account,
      });

      let transaction = newTransaction.save();
      return transaction;
    },

    newInstallment: async (_, args) => {
      const { target, amount } = args;

      await Saving.updateOne(
        {
          id: target,
        },
        {
          $inc: { amount },
        }
      );

      let saving = await Saving.findById(target);
      return saving;
    },

    newAccount: async (_, args) => {
      const { name, image, email, password, telephone } = args;

      cloudinary.v2.uploader
        .upload(image, {
          public_id: "",
          folder: "users",
        })
        .then((res) => {
          let newAccount = new Account({
            name,
            image: res.url,
            email,
            password,
            telephone,
          });

          let account = newAccount.save();
          return account;
        })
        .catch((err) => null);
    },
  },
};

export default resolvers;
