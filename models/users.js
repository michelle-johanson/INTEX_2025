// models/users.js

let users = [
    { UserID: 1, Username: "michelle", Password: "my_password", AccessLevel: "manager" },
    { UserID: 2, Username: "user", Password: "test123", AccessLevel: "user" }
];

module.exports = {
    getAll: () => users,

    findById: (id) => users.find(u => u.UserID === Number(id)),

    findByUsername: (username) =>
        users.find(u => u.Username === username),

    validateCredentials: (username, password) =>
        users.find(u => u.Username === username && u.Password === password)
};
