// TEMPORARY in-memory fake users
let users = [
    {
        id: 1,
        username: "michelle",
        password: "my_password",
        access_level: "admin"
    },
    {
        id: 2,
        username: "user",
        password: "test123",
        access_level: "user"
    }
];

module.exports = {
    getAll: () => users,

    findById: (id) => users.find(u => u.id === Number(id)),

    findByUsername: (username) =>
        users.find(u => u.username === username),

    validateCredentials: (username, password) =>
        users.find(u => u.username === username && u.password === password)
};
