CREATE TABLE IF NOT EXISTS account (
    account_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255),
    password VARCHAR(255)
    -- Removed income
);

CREATE TABLE IF NOT EXISTS budget (
    -- Added budget id
    budget_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, 
    account_id INT UNSIGNED,
    name VARCHAR(255),
    amount INT,
    allocation INT,
    FOREIGN KEY (account_id) REFERENCES account(account_id)
);

CREATE TABLE IF NOT EXISTS events (
    event_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    budget_id INT UNSIGNED,
    event_name VARCHAR(255),
    occurrence INT,
    payment INT,
    end_date DATE,
    start_date DATE,
    CHECK (start_date <= end_date),
    -- Connected event with budget
    FOREIGN KEY (budget_id) REFERENCES budget(budget_id)
);

CREATE TABLE IF NOT EXISTS income (
    account_id INT UNSIGNED,
    name VARCHAR(255) PRIMARY KEY,
    amount INT,
    occurrence VARCHAR(255),
    FOREIGN KEY (account_id) REFERENCES account(account_id)
);