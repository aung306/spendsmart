CREATE TABLE IF NOT EXISTS account (
    account_id SERIAL PRIMARY KEY,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255),
    password VARCHAR(255),
    disposable_income INT,
    biweekly_income INT
);

CREATE TABLE IF NOT EXISTS budget (
    account_id INT,
    name VARCHAR(255) PRIMARY KEY,
    amount INT,
    FOREIGN KEY (account_id) REFERENCES account(account_id)
);

CREATE TABLE events (
    account_id INT,
    event_name VARCHAR(255) PRIMARY KEY,
    occurrence INT,
    payment INT,
    FOREIGN KEY (account_id) REFERENCES account(account_id)
);

CREATE TABLE income (
    account_id INT,
    name VARCHAR(255) PRIMARY KEY,
    amount INT,
    occurrence INT,
    FOREIGN KEY (account_id) REFERENCES account(account_id)
);