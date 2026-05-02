const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./db");
const dbPromise = db.promise();

const authRoutes = require("./routes/auth");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 3000;

const DAILY_REWARD = 300;
const WEEKLY_REWARD = 1500;

const ONE_PAIR_PLUS = [
    "원페어",
    "투페어",
    "트리플",
    "스트레이트",
    "플러시",
    "풀하우스",
    "포카드",
    "스트레이트 플러시",
    "로얄 스트레이트 플러시",
    "파이브 카드"
];

const TWO_PAIR_PLUS = [
    "투페어",
    "트리플",
    "스트레이트",
    "플러시",
    "풀하우스",
    "포카드",
    "스트레이트 플러시",
    "로얄 스트레이트 플러시",
    "파이브 카드"
];

function getTodayKey() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function getWeekKey() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), 0, 1);
    const pastDays = Math.floor((now - firstDay) / 86400000);
    const week = Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

async function getCount(sql, params) {
    const [rows] = await dbPromise.query(sql, params);
    return Number(rows[0].count ?? 0);
}

function makeMission(key, title, progress, target) {
    return {
        key,
        title,
        progress,
        target,
        completed: progress >= target
    };
}

async function getMissionData(userId) {
    const todayKey = getTodayKey();
    const weekKey = getWeekKey();

    const [
        dailyPlayCount,
        dailyWinCount,
        dailyMiniEnterCount,
        dailyOnePairPlusCount,

        weeklyPlayCount,
        weeklyWinCount,
        weeklyMiniEnterCount,
        weeklyMiniSuccessCount,
        weeklyTwoPairPlusCount,

        totalPlayCount,
        totalWinCount,
        onePairCount,
        twoPairCount,
        fullHouseCount,
        fourCardCount,
        royalCount,
        fiveCardCount,
        totalMiniSuccessCount,
        jackpotUsedCount
    ] = await Promise.all([
        getCount(
            `SELECT COUNT(*) AS count
             FROM game_logs
             WHERE user_id = ?
             AND created_at >= CURDATE()
             AND created_at < CURDATE() + INTERVAL 1 DAY`,
            [userId]
        ),

        getCount(
            `SELECT COUNT(*) AS count
             FROM game_logs
             WHERE user_id = ?
             AND final_reward > 0
             AND created_at >= CURDATE()
             AND created_at < CURDATE() + INTERVAL 1 DAY`,
            [userId]
        ),

        getCount(
            `SELECT COUNT(*) AS count
             FROM game_logs
             WHERE user_id = ?
             AND used_mini_game = 1
             AND created_at >= CURDATE()
             AND created_at < CURDATE() + INTERVAL 1 DAY`,
            [userId]
        ),

        getCount(
            `SELECT COUNT(*) AS count
             FROM game_logs
             WHERE user_id = ?
             AND hand_name IN (?)
             AND created_at >= CURDATE()
             AND created_at < CURDATE() + INTERVAL 1 DAY`,
            [userId, ONE_PAIR_PLUS]
        ),

        getCount(
            `SELECT COUNT(*) AS count
             FROM game_logs
             WHERE user_id = ?
             AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)`,
            [userId]
        ),

        getCount(
            `SELECT COUNT(*) AS count
             FROM game_logs
             WHERE user_id = ?
             AND final_reward > 0
             AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)`,
            [userId]
        ),

        getCount(
            `SELECT COUNT(*) AS count
             FROM game_logs
             WHERE user_id = ?
             AND used_mini_game = 1
             AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)`,
            [userId]
        ),

        getCount(
            `SELECT COUNT(*) AS count
             FROM game_logs
             WHERE user_id = ?
             AND mini_result = 'success'
             AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)`,
            [userId]
        ),

        getCount(
            `SELECT COUNT(*) AS count
             FROM game_logs
             WHERE user_id = ?
             AND hand_name IN (?)
             AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)`,
            [userId, TWO_PAIR_PLUS]
        ),

        getCount(
            `SELECT COUNT(*) AS count
             FROM game_logs
             WHERE user_id = ?`,
            [userId]
        ),

        getCount(
            `SELECT COUNT(*) AS count
             FROM game_logs
             WHERE user_id = ?
             AND final_reward > 0`,
            [userId]
        ),

        getCount(
            `SELECT COUNT(*) AS count
             FROM game_logs
             WHERE user_id = ?
             AND hand_name = '원페어'`,
            [userId]
        ),

        getCount(
            `SELECT COUNT(*) AS count
             FROM game_logs
             WHERE user_id = ?
             AND hand_name = '투페어'`,
            [userId]
        ),

        getCount(
            `SELECT COUNT(*) AS count
             FROM game_logs
             WHERE user_id = ?
             AND hand_name = '풀하우스'`,
            [userId]
        ),

        getCount(
            `SELECT COUNT(*) AS count
             FROM game_logs
             WHERE user_id = ?
             AND hand_name = '포카드'`,
            [userId]
        ),

        getCount(
            `SELECT COUNT(*) AS count
             FROM game_logs
             WHERE user_id = ?
             AND hand_name = '로얄 스트레이트 플러시'`,
            [userId]
        ),

        getCount(
            `SELECT COUNT(*) AS count
             FROM game_logs
             WHERE user_id = ?
             AND hand_name = '파이브 카드'`,
            [userId]
        ),

        getCount(
            `SELECT COUNT(*) AS count
             FROM game_logs
             WHERE user_id = ?
             AND mini_result = 'success'`,
            [userId]
        ),

        getCount(
            `SELECT COUNT(*) AS count
             FROM game_logs
             WHERE user_id = ?
             AND jackpot_used = 1`,
            [userId]
        )
    ]);

    const dailyMissions = [
        makeMission("daily_first_game", "오늘 첫 판 플레이", dailyPlayCount, 1),
        makeMission("daily_play_5", "오늘 5판 플레이", dailyPlayCount, 5),
        makeMission("daily_mini_enter_1", "미니게임 1회 진입", dailyMiniEnterCount, 1),
        makeMission("daily_first_win", "오늘 첫 승리", dailyWinCount, 1),
        makeMission("daily_onepair_plus_2", "원페어 이상 2회 달성", dailyOnePairPlusCount, 2)
    ];

    const weeklyMissions = [
        makeMission("weekly_play_20", "이번 주 20판 플레이", weeklyPlayCount, 20),
        makeMission("weekly_win_5", "이번 주 5승 달성", weeklyWinCount, 5),
        makeMission("weekly_mini_enter_5", "미니게임 5회 진입", weeklyMiniEnterCount, 5),
        makeMission("weekly_mini_success_2", "미니게임 2회 성공", weeklyMiniSuccessCount, 2),
        makeMission("weekly_twopair_plus_5", "투페어 이상 5회 달성", weeklyTwoPairPlusCount, 5)
    ];

    const achievements = [
        { key: "ach_first_game", title: "첫 걸음", progress: totalPlayCount, target: 1, reward: 100 },
        { key: "ach_first_win", title: "첫 승리", progress: totalWinCount, target: 1, reward: 200 },
        { key: "ach_play_10", title: "10판 플레이", progress: totalPlayCount, target: 10, reward: 300 },
        { key: "ach_play_50", title: "50판 플레이", progress: totalPlayCount, target: 50, reward: 700 },
        { key: "ach_play_100", title: "100판 플레이", progress: totalPlayCount, target: 100, reward: 1500 },
        { key: "ach_onepair_10", title: "원페어 입문자", progress: onePairCount, target: 10, reward: 300 },
        { key: "ach_twopair_10", title: "투페어 사냥꾼", progress: twoPairCount, target: 10, reward: 500 },
        { key: "ach_fullhouse_1", title: "풀하우스 입성", progress: fullHouseCount, target: 1, reward: 1200 },
        { key: "ach_fourcard_1", title: "포카드의 주인", progress: fourCardCount, target: 1, reward: 2000 },
        { key: "ach_mini_success_1", title: "첫 미니게임 성공", progress: totalMiniSuccessCount, target: 1, reward: 500 },
        { key: "ach_jackpot_1", title: "잭팟 첫 수령", progress: jackpotUsedCount, target: 1, reward: 2000 },
        { key: "ach_royal_1", title: "로얄의 선택", progress: royalCount, target: 1, reward: 5000 },
        { key: "ach_fivecard_1", title: "파이브 카드 전설", progress: fiveCardCount, target: 1, reward: 7000 }
    ].map(mission => ({
        ...mission,
        completed: mission.progress >= mission.target
    }));

    const [claims] = await dbPromise.query(
        `SELECT mission_type, mission_key, period_key
         FROM mission_claims
         WHERE user_id = ?`,
        [userId]
    );

    const isClaimed = (missionType, missionKey, periodKey) => {
        return claims.some(claim =>
            claim.mission_type === missionType &&
            claim.mission_key === missionKey &&
            claim.period_key === periodKey
        );
    };

    const dailyRewardClaimed = isClaimed("daily", "daily_all", todayKey);
    const weeklyRewardClaimed = isClaimed("weekly", "weekly_all", weekKey);

    const achievementsWithClaim = achievements.map(mission => ({
        ...mission,
        claimed: isClaimed("achievement", mission.key, "permanent")
    }));

    return {
        daily: {
            missions: dailyMissions,
            reward: DAILY_REWARD,
            allCompleted: dailyMissions.every(mission => mission.completed),
            claimed: dailyRewardClaimed,
            periodKey: todayKey
        },
        weekly: {
            missions: weeklyMissions,
            reward: WEEKLY_REWARD,
            allCompleted: weeklyMissions.every(mission => mission.completed),
            claimed: weeklyRewardClaimed,
            periodKey: weekKey
        },
        achievements: achievementsWithClaim
    };
}

async function claimMissionReward(userId, missionType, missionKey, periodKey, reward) {
    try {
        await dbPromise.query(
            `INSERT INTO mission_claims
             (user_id, mission_type, mission_key, period_key, reward)
             VALUES (?, ?, ?, ?, ?)`,
            [userId, missionType, missionKey, periodKey, reward]
        );

        await dbPromise.query(
            `UPDATE users
             SET coin = coin + ?
             WHERE id = ?`,
            [reward, userId]
        );

        const [users] = await dbPromise.query(
            `SELECT id, username, email, coin, jackpot, win, lose_count
             FROM users
             WHERE id = ?`,
            [userId]
        );

        return users[0];
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            throw new Error("이미 보상을 수령했습니다.");
        }

        throw error;
    }
}

app.get("/api/auth/missions/:userId", async (req, res) => {
    try {
        const userId = Number(req.params.userId);
        const missions = await getMissionData(userId);

        res.json({
            missions
        });
    } catch (error) {
        console.error("미션 조회 실패:", error);
        res.status(500).json({ message: "미션 조회 실패" });
    }
});

app.post("/api/auth/missions/claim-daily", async (req, res) => {
    try {
        const { userId } = req.body;
        const missionData = await getMissionData(userId);

        if (!missionData.daily.allCompleted) {
            return res.status(400).json({ message: "일일 미션이 아직 완료되지 않았습니다." });
        }

        if (missionData.daily.claimed) {
            return res.status(400).json({ message: "이미 일일 보상을 받았습니다." });
        }

        const updatedUser = await claimMissionReward(
            userId,
            "daily",
            "daily_all",
            missionData.daily.periodKey,
            DAILY_REWARD
        );

        res.json({
            message: "일일 미션 보상을 받았습니다.",
            user: updatedUser
        });
    } catch (error) {
        console.error("일일 미션 보상 수령 실패:", error);
        res.status(500).json({ message: error.message || "일일 미션 보상 수령 실패" });
    }
});

app.post("/api/auth/missions/claim-weekly", async (req, res) => {
    try {
        const { userId } = req.body;
        const missionData = await getMissionData(userId);

        if (!missionData.weekly.allCompleted) {
            return res.status(400).json({ message: "주간 미션이 아직 완료되지 않았습니다." });
        }

        if (missionData.weekly.claimed) {
            return res.status(400).json({ message: "이미 주간 보상을 받았습니다." });
        }

        const updatedUser = await claimMissionReward(
            userId,
            "weekly",
            "weekly_all",
            missionData.weekly.periodKey,
            WEEKLY_REWARD
        );

        res.json({
            message: "주간 미션 보상을 받았습니다.",
            user: updatedUser
        });
    } catch (error) {
        console.error("주간 미션 보상 수령 실패:", error);
        res.status(500).json({ message: error.message || "주간 미션 보상 수령 실패" });
    }
});

app.post("/api/auth/missions/claim-achievement", async (req, res) => {
    try {
        const { userId, missionKey } = req.body;
        const missionData = await getMissionData(userId);

        const achievement = missionData.achievements.find(mission => mission.key === missionKey);

        if (!achievement) {
            return res.status(404).json({ message: "업적을 찾을 수 없습니다." });
        }

        if (!achievement.completed) {
            return res.status(400).json({ message: "아직 업적이 완료되지 않았습니다." });
        }

        if (achievement.claimed) {
            return res.status(400).json({ message: "이미 업적 보상을 받았습니다." });
        }

        const updatedUser = await claimMissionReward(
            userId,
            "achievement",
            missionKey,
            "permanent",
            achievement.reward
        );

        res.json({
            message: "업적 보상을 받았습니다.",
            user: updatedUser
        });
    } catch (error) {
        console.error("업적 보상 수령 실패:", error);
        res.status(500).json({ message: error.message || "업적 보상 수령 실패" });
    }
});

app.post("/api/auth/daily-support", async (req, res) => {
    try {
        const { userId } = req.body;
        const supportAmount = 500;

        if (!userId) {
            return res.status(400).json({ message: "userId가 없습니다." });
        }

        const [users] = await dbPromise.query(
            `SELECT id, username, email, coin, jackpot, win, lose_count
             FROM users
             WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "유저를 찾을 수 없습니다." });
        }

        const user = users[0];

        if (Number(user.coin) >= 10) {
            return res.status(400).json({
                message: "코인이 아직 부족하지 않습니다."
            });
        }

        await dbPromise.query(
            `INSERT INTO daily_support_claims
             (user_id, support_date, amount)
             VALUES (?, CURDATE(), ?)`,
            [userId, supportAmount]
        );

        await dbPromise.query(
            `UPDATE users
             SET coin = coin + ?
             WHERE id = ?`,
            [supportAmount, userId]
        );

        const [updatedUsers] = await dbPromise.query(
            `SELECT id, username, email, coin, jackpot, win, lose_count
             FROM users
             WHERE id = ?`,
            [userId]
        );

        res.json({
            message: `오늘의 지원금 ${supportAmount}P를 받았습니다.`,
            user: updatedUsers[0]
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({
                message: "오늘은 이미 지원금을 받았습니다."
            });
        }

        console.error("지원금 수령 실패:", error);
        res.status(500).json({ message: "지원금 수령 실패" });
    }
});


app.listen(PORT, () => {
    console.log(`서버 실행 중: http://localhost:${PORT}`);
});