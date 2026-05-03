const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");

const router = express.Router();

router.post("/register", async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({
            message: "모든 항목을 입력해주세요."
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users (username, email, password, coin)
            VALUES (?, ?, ?, ?)
        `;

        db.query(sql, [username, email, hashedPassword, 3000], (err) => {
            if (err) {
                console.error(err);
                return res.status(400).json({
                    message: "이미 존재하는 아이디 또는 이메일입니다."
                });
            }

            res.status(201).json({
                message: "회원가입 성공"
            });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "서버 오류가 발생했습니다."
        });
    }
});

router.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            message: "아이디와 비밀번호를 입력해주세요."
        });
    }

    const sql = "SELECT * FROM users WHERE username = ?";

    db.query(sql, [username], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "서버 오류가 발생했습니다."
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                message: "아이디 또는 비밀번호가 틀렸습니다."
            });
        }

        const user = results[0];

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "아이디 또는 비밀번호가 틀렸습니다."
            });
        }

        res.json({
            message: "로그인 성공",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                coin: Number(user.coin ?? 0),
                jackpot: Number(user.jackpot ?? 0),
                win: Number(user.win ?? 0),
                lose_count: Number(user.lose_count ?? 0)
            }
        });
    });
});

router.post("/reset-password", async (req, res) => {
    const { username, email, newPassword } = req.body;

    if (!username || !email || !newPassword) {
        return res.status(400).json({
            message: "아이디, 이메일, 새 비밀번호를 모두 입력해주세요."
        });
    }

    if (newPassword.length < 4) {
        return res.status(400).json({
            message: "새 비밀번호는 4자 이상 입력해주세요."
        });
    }

    const findSql = `
        SELECT id
        FROM users
        WHERE username = ? AND email = ?
    `;

    db.query(findSql, [username, email], async (err, results) => {
        if (err) {
            console.error("비밀번호 재설정 유저 조회 실패:", err);
            return res.status(500).json({
                message: "서버 오류가 발생했습니다."
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "아이디 또는 이메일이 일치하지 않습니다."
            });
        }

        try {
            const user = results[0];
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            const updateSql = `
                UPDATE users
                SET password = ?
                WHERE id = ?
            `;

            db.query(updateSql, [hashedPassword, user.id], (updateErr) => {
                if (updateErr) {
                    console.error("비밀번호 변경 실패:", updateErr);
                    return res.status(500).json({
                        message: "비밀번호 변경 실패"
                    });
                }

                res.json({
                    message: "비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요."
                });
            });
        } catch (error) {
            console.error("비밀번호 암호화 실패:", error);
            res.status(500).json({
                message: "서버 오류가 발생했습니다."
            });
        }
    });
});

router.put("/update-user", (req, res) => {
    const { id, coin, jackpot, win, lose_count } = req.body;

    if (!id) {
        return res.status(400).json({
            message: "유저 ID가 없습니다."
        });
    }

    const sql = `
        UPDATE users
        SET coin = ?, jackpot = ?, win = ?, lose_count = ?
        WHERE id = ?
    `;

    db.query(sql, [coin, jackpot, win, lose_count, id], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "유저 정보 저장 실패"
            });
        }

        res.json({
            message: "유저 정보 저장 성공",
            user: {
                id,
                coin,
                jackpot,
                win,
                lose_count
            }
        });
    });
});
router.get("/ranking", (req, res) => {
    const sort = req.query.sort || "coin";

    let orderColumn = "coin";

    if (sort === "win") {
        orderColumn = "win";
    }

    if (sort === "jackpot") {
        orderColumn = "jackpot";
    }

    const sql = `
        SELECT 
            username,
            coin,
            jackpot,
            win,
            lose_count
        FROM users
        ORDER BY ${orderColumn} DESC
        LIMIT 10
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "랭킹 조회 실패"
            });
        }

        res.json({
            message: "랭킹 조회 성공",
            ranking: results
        });
    });
});
router.post("/game-log", (req, res) => {
    const {
        user_id,
        username,
        bet,
        hand_name,
        base_reward,
        jackpot_fee,
        final_reward,
        used_mini_game,
        mini_result,
        jackpot_used,
        final_cards,
        joker_used
    } = req.body;

    if (!user_id || !username) {
        return res.status(400).json({
            message: "유저 정보가 없습니다."
        });
    }

    const sql = `
        INSERT INTO game_logs
        (
            user_id,
            username,
            bet,
            hand_name,
            base_reward,
            jackpot_fee,
            final_reward,
            used_mini_game,
            mini_result,
            jackpot_used,
            final_cards,
            joker_used
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            user_id,
            username,
            bet,
            hand_name,
            base_reward,
            jackpot_fee,
            final_reward,
            used_mini_game,
            mini_result,
            jackpot_used,
            final_cards ? JSON.stringify(final_cards) : null,
            joker_used ? 1 : 0
        ],
        (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "게임 기록 저장 실패"
                });
            }

            res.json({
                message: "게임 기록 저장 성공"
            });
        }
    );
});

router.get("/game-logs/:userId", (req, res) => {
    const { userId } = req.params;

    const sql = `
        SELECT *
        FROM game_logs
        WHERE user_id = ?
        ORDER BY created_at DESC
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("게임 기록 조회 실패:", err);
            return res.status(500).json({
                message: "게임 기록 조회 실패"
            });
        }

        res.json(results);
    });
});

router.get("/user-stats/:userId", (req, res) => {
    const userId = req.params.userId;

    const statsSql = `
        SELECT
            COUNT(*) AS total_games,
            COALESCE(SUM(CASE WHEN final_reward > 0 THEN 1 ELSE 0 END), 0) AS win_games,
            COALESCE(SUM(CASE WHEN final_reward <= 0 THEN 1 ELSE 0 END), 0) AS lose_games,
            COALESCE(SUM(final_reward), 0) AS total_reward,
            COALESCE(MAX(final_reward), 0) AS max_reward,
            COALESCE(AVG(final_reward), 0) AS avg_reward,
            COALESCE(SUM(bet), 0) AS total_bet,
            COALESCE(MAX(bet), 0) AS max_bet,
            COALESCE(SUM(jackpot_fee), 0) AS total_jackpot_fee,
            COALESCE(SUM(CASE WHEN used_mini_game = 1 THEN 1 ELSE 0 END), 0) AS mini_enter_count,
            COALESCE(SUM(CASE WHEN mini_result = 'success' THEN 1 ELSE 0 END), 0) AS mini_success_count,
            COALESCE(SUM(CASE WHEN mini_result = 'fail' THEN 1 ELSE 0 END), 0) AS mini_fail_count,
            COALESCE(SUM(CASE WHEN jackpot_used = 1 THEN 1 ELSE 0 END), 0) AS jackpot_used_count,

            COALESCE(SUM(CASE WHEN joker_used = 1 THEN 1 ELSE 0 END), 0) AS joker_used_count,

            COALESCE(SUM(CASE WHEN joker_used = 1 AND final_reward > 0 THEN 1 ELSE 0 END), 0) AS joker_win_count
        FROM game_logs
        WHERE user_id = ?
    `;

    const favoriteHandSql = `
        SELECT hand_name, COUNT(*) AS count
        FROM game_logs
        WHERE user_id = ?
        GROUP BY hand_name
        ORDER BY count DESC, hand_name ASC
        LIMIT 1
    `;

    const handCountsSql = `
        SELECT hand_name, COUNT(*) AS count
        FROM game_logs
        WHERE user_id = ?
        GROUP BY hand_name
        ORDER BY count DESC, hand_name ASC
    `;

    db.query(statsSql, [userId], (statsErr, statsRows) => {
        if (statsErr) {
            console.error("통계 조회 실패:", statsErr);
            return res.status(500).json({ message: "통계 조회 실패" });
        }

        db.query(favoriteHandSql, [userId], (favoriteErr, favoriteRows) => {
            if (favoriteErr) {
                console.error("최다 족보 조회 실패:", favoriteErr);
                return res.status(500).json({ message: "최다 족보 조회 실패" });
            }

            db.query(handCountsSql, [userId], (handErr, handRows) => {
                if (handErr) {
                    console.error("족보별 횟수 조회 실패:", handErr);
                    return res.status(500).json({ message: "족보별 횟수 조회 실패" });
                }

                const stats = statsRows[0] || {};
                const favoriteHand = favoriteRows[0] || null;

                const totalGames = Number(stats.total_games ?? 0);
                const winGames = Number(stats.win_games ?? 0);
                const miniEnterCount = Number(stats.mini_enter_count ?? 0);
                const miniSuccessCount = Number(stats.mini_success_count ?? 0);

                const jokerUsedCount = Number(stats.joker_used_count ?? 0);
                const jokerWinCount = Number(stats.joker_win_count ?? 0);

                const winRate = totalGames > 0
                    ? (winGames / totalGames) * 100
                    : 0;

                const miniSuccessRate = miniEnterCount > 0
                    ? (miniSuccessCount / miniEnterCount) * 100
                    : 0;

                const jokerRate = totalGames > 0
                    ? (jokerUsedCount / totalGames) * 100
                    : 0;

                res.json({
                    total_games: totalGames,
                    win_games: winGames,
                    lose_games: Number(stats.lose_games ?? 0),
                    win_rate: winRate,

                    total_reward: Number(stats.total_reward ?? 0),
                    max_reward: Number(stats.max_reward ?? 0),
                    avg_reward: Number(stats.avg_reward ?? 0),

                    total_bet: Number(stats.total_bet ?? 0),
                    max_bet: Number(stats.max_bet ?? 0),

                    total_jackpot_fee: Number(stats.total_jackpot_fee ?? 0),
                    jackpot_used_count: Number(stats.jackpot_used_count ?? 0),

                    joker_used_count: jokerUsedCount,
                    joker_win_count: jokerWinCount,
                    joker_rate: jokerRate,

                    mini_enter_count: miniEnterCount,
                    mini_success_count: miniSuccessCount,
                    mini_fail_count: Number(stats.mini_fail_count ?? 0),
                    mini_success_rate: miniSuccessRate,

                    favorite_hand: favoriteHand ? favoriteHand.hand_name : "-",
                    favorite_hand_count: favoriteHand ? Number(favoriteHand.count) : 0,

                    hand_counts: handRows.map(row => ({
                        hand_name: row.hand_name,
                        count: Number(row.count)
                    }))
                });
            });
        });
    });
});

router.get("/user/:id", (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT id, username, email, coin, jackpot, win, lose_count
        FROM users
        WHERE id = ?
    `;

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "유저 정보 조회 실패"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "유저를 찾을 수 없습니다."
            });
        }

        const user = results[0];

        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                coin: Number(user.coin ?? 0),
                jackpot: Number(user.jackpot ?? 0),
                win: Number(user.win ?? 0),
                lose_count: Number(user.lose_count ?? 0)
            }
        });
    });
});

module.exports = router;