import { useEffect, useState } from "react";
import { API_BASE_URL } from "../api";

function MissionModal({ isOpen, onClose, user, setUser }) {
    const [activeTab, setActiveTab] = useState("daily");
    const [missions, setMissions] = useState(null);
    const [message, setMessage] = useState("");

    const fetchMissions = async () => {
        if (!user?.id) return;

        try {
            const response = await fetch(`${API_BASE_URL}/missions/${user.id}`);
            const data = await response.json();

            if (response.ok) {
                setMissions(data.missions);
            } else {
                setMessage(data.message || "미션 정보를 불러오지 못했습니다.");
            }
        } catch (error) {
            console.error("미션 조회 실패:", error);
            setMessage("미션 정보를 불러오는 중 오류가 발생했습니다.");
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchMissions();
        }
    }, [isOpen, user?.id]);

    if (!isOpen) return null;

    const updateUserAfterClaim = (updatedUser) => {
        const freshUser = {
            ...updatedUser,
            coin: Number(updatedUser.coin ?? 0),
            jackpot: Number(updatedUser.jackpot ?? 0),
            win: Number(updatedUser.win ?? 0),
            lose_count: Number(updatedUser.lose_count ?? 0)
        };

        setUser(freshUser);
        localStorage.setItem("pokerUser", JSON.stringify(freshUser));
    };

    const claimDailyReward = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/missions/claim-daily`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userId: user.id
                })
            });

            const data = await response.json();

            if (response.ok) {
                updateUserAfterClaim(data.user);
                setMessage(data.message);
                fetchMissions();
            } else {
                setMessage(data.message || "보상 수령 실패");
            }
        } catch (error) {
            console.error(error);
            setMessage("보상 수령 중 오류가 발생했습니다.");
        }
    };

    const claimWeeklyReward = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/missions/claim-weekly`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userId: user.id
                })
            });

            const data = await response.json();

            if (response.ok) {
                updateUserAfterClaim(data.user);
                setMessage(data.message);
                fetchMissions();
            } else {
                setMessage(data.message || "보상 수령 실패");
            }
        } catch (error) {
            console.error(error);
            setMessage("보상 수령 중 오류가 발생했습니다.");
        }
    };

    const claimAchievementReward = async (missionKey) => {
        try {
            const response = await fetch(`${API_BASE_URL}/missions/claim-achievement`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userId: user.id,
                    missionKey
                })
            });

            const data = await response.json();

            if (response.ok) {
                updateUserAfterClaim(data.user);
                setMessage(data.message);
                fetchMissions();
            } else {
                setMessage(data.message || "보상 수령 실패");
            }
        } catch (error) {
            console.error(error);
            setMessage("보상 수령 중 오류가 발생했습니다.");
        }
    };

    const renderMissionItem = (mission) => {
        const progress = Math.min(mission.progress, mission.target);
        const percent = Math.min((progress / mission.target) * 100, 100);

        return (
            <div className={`mission-item ${mission.completed ? "mission-completed" : ""}`} key={mission.key}>
                <div className="mission-item-top">
                    <strong>{mission.title}</strong>
                    <span>{progress} / {mission.target}</span>
                </div>

                <div className="mission-progress">
                    <div
                        className="mission-progress-fill"
                        style={{ width: `${percent}%` }}
                    ></div>
                </div>

                <p className="mission-status">
                    {mission.completed ? "완료" : "진행중"}
                </p>
            </div>
        );
    };

    const renderDaily = () => {
        if (!missions) return null;

        return (
            <>
                <h3>일일 미션</h3>

                {missions.daily.missions.map(renderMissionItem)}

                <div className="mission-reward-box">
                    <p>일일 미션 전체 완료 보상: <strong>{missions.daily.reward}P</strong></p>

                    {missions.daily.claimed ? (
                        <button disabled>오늘 보상 수령 완료</button>
                    ) : (
                        <button
                            onClick={claimDailyReward}
                            disabled={!missions.daily.allCompleted}
                        >
                            일일 보상 받기
                        </button>
                    )}
                </div>
            </>
        );
    };

    const renderWeekly = () => {
        if (!missions) return null;

        return (
            <>
                <h3>주간 미션</h3>

                {missions.weekly.missions.map(renderMissionItem)}

                <div className="mission-reward-box">
                    <p>주간 미션 전체 완료 보상: <strong>{missions.weekly.reward}P</strong></p>

                    {missions.weekly.claimed ? (
                        <button disabled>이번 주 보상 수령 완료</button>
                    ) : (
                        <button
                            onClick={claimWeeklyReward}
                            disabled={!missions.weekly.allCompleted}
                        >
                            주간 보상 받기
                        </button>
                    )}
                </div>
            </>
        );
    };

    const renderAchievements = () => {
        if (!missions) return null;

        return (
            <>
                <h3>업적 미션</h3>

                {missions.achievements.map((mission) => {
                    const progress = Math.min(mission.progress, mission.target);
                    const percent = Math.min((progress / mission.target) * 100, 100);

                    return (
                        <div
                            className={`mission-item ${mission.completed ? "mission-completed" : ""}`}
                            key={mission.key}
                        >
                            <div className="mission-item-top">
                                <strong>{mission.title}</strong>
                                <span>{progress} / {mission.target}</span>
                            </div>

                            <div className="mission-progress">
                                <div
                                    className="mission-progress-fill"
                                    style={{ width: `${percent}%` }}
                                ></div>
                            </div>

                            <div className="achievement-bottom">
                                <p>보상: {mission.reward}P</p>

                                {mission.claimed ? (
                                    <button disabled>수령 완료</button>
                                ) : (
                                    <button
                                        onClick={() => claimAchievementReward(mission.key)}
                                        disabled={!mission.completed}
                                    >
                                        보상 받기
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </>
        );
    };

    return (
        <div className="mission-modal-backdrop">
            <div className="mission-modal">
                <div className="mission-modal-header">
                    <h2>미션</h2>
                    <button
                        type="button"
                        className="mission-close-button"
                        onClick={onClose}
                    >
                        닫기
                    </button>
                </div>

                <div className="mission-tabs">
                    <button
                        type="button"
                        className={activeTab === "daily" ? "active" : ""}
                        onClick={() => {
                            console.log("일일 클릭");
                            setActiveTab("daily");
                        }}
                    >
                        일일
                    </button>

                    <button
                        type="button"
                        className={activeTab === "weekly" ? "active" : ""}
                        onClick={() => {
                            console.log("주간 클릭");
                            setActiveTab("weekly");
                        }}
                    >
                        주간
                    </button>

                    <button
                        type="button"
                        className={activeTab === "achievement" ? "active" : ""}
                        onClick={() => {
                            console.log("업적 클릭");
                            setActiveTab("achievement");
                        }}
                    >
                        업적
                    </button>
                </div>

                {message && <p className="mission-message">{message}</p>}

                <div className="mission-content">
                    {!missions && <p>미션 정보를 불러오는 중...</p>}

                    {missions && activeTab === "daily" && renderDaily()}
                    {missions && activeTab === "weekly" && renderWeekly()}
                    {missions && activeTab === "achievement" && renderAchievements()}
                </div>
            </div>
        </div>
    );
}

export default MissionModal;