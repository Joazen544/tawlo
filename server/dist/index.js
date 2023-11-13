import express from "express";
const app = express();
app.listen(3000, () => {
    console.log("port running on 3000");
});
class Account {
    constructor(id, owner, _balance) {
        this.id = id;
        this.owner = owner;
        this._balance = _balance;
    }
    deposit(amount) {
        if (amount <= 0) {
            throw new Error("Invalid amount");
        }
        this._balance += amount;
    }
    get balance() {
        return this._balance;
    }
    set balance(value) {
        if (value < 0)
            throw new Error("Invalid Value");
        this._balance = value;
    }
}
let account = new Account(1, "Mosh", 0);
console.log(account.owner);
console.log(account.balance);
account.deposit(55);
console.log(account.balance);
//# sourceMappingURL=index.js.map