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

        const recents = await Transaction.find().sort({ createdAt: 1 });

        const savings = await Saving.find({ account }).sort({ createdAt: -1 });

        // Get formatted date
        const getFormattedDate = (unixDate) => {
          const date = new Date(Number(unixDate));
          const day = date.getDate().toString().padStart(2, "0"); // Get day and pad with leading zero if necessary
          const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Get month (0-indexed) and pad with leading zero if necessary
          const year = date.getFullYear();

          const formattedDate = `${day}/${month}/${year}`;

          return formattedDate;
        };

        // Get unique dates from transactions array
        const uniqueDates = [
          ...new Set(recents.map((t) => getFormattedDate(t.createdAt))),
        ];

        // Initialize empty result array
        const dailys = uniqueDates.map((date) => ({
          day: date,
          CASH_IN: 0,
          CASH_OUT: 0,
        }));

        // Loop through transactions and update result array
        recents.forEach((transaction) => {
          const date = getFormattedDate(transaction.createdAt);

          const index = dailys.findIndex((r) => r.day === date);
          if (index > -1) {
            if (transaction.type === "CASH_IN") {
              dailys[index].CASH_IN += transaction.amount;
            } else if (transaction.type === "CASH_OUT") {
              dailys[index].CASH_OUT += transaction.amount;
            }
          }
        });

        // Define a function to calculate the average of an array of numbers
        function calculateAverage(numbers) {
          if (numbers.length === 0) {
            return 0;
          }
          const sum = numbers.reduce((acc, cur) => acc + cur);
          return sum / numbers.length;
        }

        // Get averages of the dailys
        const cashOutTransactionsThisMonth = dailys
          .filter((transaction) => {
            const month = Number(transaction.day.split("/")[1]);

            return month === new Date().getMonth() + 1;
          })
          .map((transaction) => transaction.CASH_OUT);

        return {
          account: _account,
          month: month[new Date().getMonth()],
          year: new Date().getFullYear(),
          spend: recents
            .filter((transaction) => transaction.type === "CASH_OUT")
            .reduce((total, transaction) => {
              if (
                new Date(Number(transaction.createdAt)).getMonth() ==
                  new Date().getMonth() &&
                new Date(Number(transaction.createdAt)).getFullYear() ==
                  new Date().getFullYear()
              ) {
                return total + transaction.amount;
              } else {
                return total;
              }
            }, 0)
            .toFixed(0),
          averageCashOut: (
            cashOutTransactionsThisMonth.reduce(
              (sum, value) => sum + value,
              0
            ) / cashOutTransactionsThisMonth.length
          ).toFixed(0),
          dailys,
          recents: recents.sort(
            (a, b) => Number(b.createdAt) - Number(a.createdAt)
          ),
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
