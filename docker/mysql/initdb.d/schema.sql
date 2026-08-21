CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    personal_id VARCHAR(50) NOT NULL UNIQUE,
    user_name VARCHAR(50) NOT NULL,
    name_kana VARCHAR(100),
    email VARCHAR(100),
    password VARCHAR(100),
    salt VARCHAR(100) NOT NULL,
    admin BOOLEAN NOT NULL,
    icon VARCHAR(500),
    deleted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    memo VARCHAR(800)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE channels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    tag VARCHAR(20) NOT NULL,
    is_enabled BOOLEAN NOT NULL,
    deleted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE rel_channel_user (
    user_id INT NOT NULL,
    channel_id INT NOT NULL,
    admin BOOLEAN NOT NULL,
    permission BOOLEAN NOT NULL,
    PRIMARY KEY (user_id, channel_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (channel_id) REFERENCES channels(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE manuals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    channel_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(200) NOT NULL,
    step_title VARCHAR(100) NOT NULL,
    tag VARCHAR(20) NOT NULL,
    thumbnail VARCHAR(200) NOT NULL,
    is_enabled BOOLEAN NOT NULL,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,
    deleted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (channel_id) REFERENCES channels(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE steps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    manual_id INT NOT NULL,
    step_no INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    contents JSON NOT NULL,             
    contents_text VARCHAR(400) NOT NULL,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,
    deleted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (manual_id) REFERENCES manuals(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- CREATE TABLE steps (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     manual_id INT NOT NULL,
--     step_no INT NOT NULL,
--     title VARCHAR(100) NOT NULL,
--     contents VARCHAR(200) NOT NULL,
--     contents_text VARCHAR(400) NOT NULL,
--     created_by INT NOT NULL,
--     updated_by INT NOT NULL,
--     deleted_at DATETIME,
--     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     FOREIGN KEY (manual_id) REFERENCES manuals(id),
--     FOREIGN KEY (created_by) REFERENCES users(id),
--     FOREIGN KEY (updated_by) REFERENCES users(id)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;




CREATE TABLE step_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    step_id INT NOT NULL,
    comment VARCHAR(800) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (step_id) REFERENCES steps(id)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE progress (
    user_id INT NOT NULL,
    manual_id INT NOT NULL,
    step_id INT NOT NULL,
    is_completed BOOLEAN NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, manual_id, step_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (manual_id) REFERENCES manuals(id),
    FOREIGN KEY (step_id) REFERENCES steps(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



