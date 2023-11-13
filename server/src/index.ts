import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send(req.body);
});

app.listen(3000, () => {
  console.log("port running on 3000");
});

class Account {
  constructor(
    public readonly id: number,
    public readonly owner: string,
    private _balance: number
  ) {}

  deposit(amount: number): void {
    if (amount <= 0) {
      throw new Error("Invalid amount");
    }
    this._balance += amount;
  }

  get balance(): number {
    return this._balance;
  }

  set balance(value: number) {
    if (value < 0) throw new Error("Invalid Value");
    this._balance = value;
  }
}

let account = new Account(1, "Mosh", 0);

console.log(account.owner);
console.log(account.balance);

account.deposit(55);

console.log(account.balance);
