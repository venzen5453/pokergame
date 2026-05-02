import { useEffect, useState } from "react";
import { API_BASE_URL } from "../api";

function MyPage({ user, setUser, setPage }) {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [logFilter, setLogFilter] = useState("all");
    const [currentLogPage, setCurrentLogPage] = useState(1);
    const [selectedLog, setSelectedLog] = useState(null);

    const formatPoint = (value) => {
        return Number(value ?? 0).toLocaleString(undefined, {
            maximumFractionDigits: 1
        });
    };

    const formatPercent = (value) => {
        return Number(value ?? 0).toFixed(1);
    };

    const parseFinalCards = (finalCards) => {
        if (!finalCards) return [];

        try {
            if (Array.isArray(finalCards)) {
                return finalCards;
            }

            return JSON.parse(finalCards);
        } catch (error) {
            console.error("최종 카드 파싱 실패:", error);
            return [];
        }
    };

    const refreshUserData = async () => {
        if (!user?.id) return;

        try {
            const response = await fetch(`${API_BASE_URL}/user/${user.id}`);
            const data = await response.json();

            if (response.ok) {
                const freshUser = {
                    ...data.user,
                    coin: Number(data.user.coin ?? 0),
                    jackpot: Number(data.user.jackpot ?? 0),
                    win: Number(data.user.win ?? 0),
                    lose_count: Number(data.user.lose_count ?? 0)
                };

                setUser(freshUser);
                localStorage.setItem("pokerUser", JSON.stringify(freshUser));
            }
        } catch (error) {
            console.error("유저 정보 새로고침 실패:", error);
        }
    };

    const fetchMyPageData = async () => {
        if (!user?.id) return;

        try {
            const [logsResponse, statsResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/game-logs/${user.id}`),
                fetch(`${API_BASE_URL}/user-stats/${user.id}`)
            ]);

            const logsData = await logsResponse.json();
            const statsData = await statsResponse.json();

            if (logsResponse.ok) {
                setLogs(Array.isArray(logsData) ? logsData : []);
            }

            if (statsResponse.ok) {
                setStats(statsData);
            }
        } catch (error) {
            console.error("마이페이지 데이터 조회 실패:", error);
        }
    };

    useEffect(() => {
        refreshUserData();
    }, [user?.id]);

    useEffect(() => {
        fetchMyPageData();
    }, [user?.id]);

    useEffect(() => {
        setCurrentLogPage(1);
    }, [logFilter]);

    if (!user) {
        return (
            <div className="mypage-container">
                <h2>로그인이 필요합니다.</h2>
                <button onClick={() => setPage("login")}>로그인으로 이동</button>
            </div>
        );
    }

    const userWin = Number(user.win ?? 0);
    const userLose = Number(user.lose_count ?? 0);
    const userTotalGames = userWin + userLose;

    const totalGames = Number(stats?.total_games ?? userTotalGames);
    const winGames = Number(stats?.win_games ?? userWin);
    const loseGames = Number(stats?.lose_games ?? userLose);
    const winRate = Number(stats?.win_rate ?? 0);

    const totalReward = Number(stats?.total_reward ?? 0);
    const maxReward = Number(stats?.max_reward ?? 0);
    const avgReward = Number(stats?.avg_reward ?? 0);

    const totalBet = Number(stats?.total_bet ?? 0);
    const maxBet = Number(stats?.max_bet ?? 0);

    const totalJackpotFee = Number(stats?.total_jackpot_fee ?? 0);
    const jackpotUsedCount = Number(stats?.jackpot_used_count ?? 0);

    const miniEnterCount = Number(stats?.mini_enter_count ?? 0);
    const miniSuccessCount = Number(stats?.mini_success_count ?? 0);
    const miniFailCount = Number(stats?.mini_fail_count ?? 0);
    const miniSuccessRate = Number(stats?.mini_success_rate ?? 0);

    const jokerUsedCount = Number(stats?.joker_used_count ?? 0);
    const jokerWinCount = Number(stats?.joker_win_count ?? 0);
    const jokerRate = Number(stats?.joker_rate ?? 0);

    const favoriteHand = stats?.favorite_hand ?? "-";
    const favoriteHandCount = Number(stats?.favorite_hand_count ?? 0);
    const handCounts = stats?.hand_counts ?? [];

    const isJackpotUsed = (log) => {
        return Number(log.jackpot_used ?? 0) === 1 || log.jackpot_used === true;
    };

    const isJokerUsed = (log) => {
        return Number(log.joker_used ?? 0) === 1 || log.joker_used === true;
    };

    const getMiniResultText = (miniResult) => {
        if (miniResult === "success") return "성공";
        if (miniResult === "fail") return "실패";
        return "안 함";
    };

    const logFilterOptions = [
        { key: "all", label: "전체" },
        { key: "win", label: "승리" },
        { key: "lose", label: "패배" },
        { key: "mini", label: "미니게임 진입" },
        { key: "mini_success", label: "미니게임 성공" },
        { key: "mini_fail", label: "미니게임 실패" },
        { key: "jackpot", label: "잭팟 사용" },
        { key: "joker", label: "조커 등장" }
    ];

    const isUsedMiniGame = (log) => {
        const miniResult = log.mini_result ?? "none";
        return Number(log.used_mini_game ?? 0) === 1 || miniResult !== "none";
    };



    const filteredLogs = logs.filter((log) => {
        const finalReward = Number(log.final_reward ?? 0);

        switch (logFilter) {
            case "win":
                return finalReward > 0;

            case "lose":
                return finalReward <= 0;

            case "mini":
                return isUsedMiniGame(log);

            case "mini_success":
                return log.mini_result === "success";

            case "mini_fail":
                return log.mini_result === "fail";

            case "jackpot":
                return isJackpotUsed(log);

            case "joker":
                return isJokerUsed(log);

            default:
                return true;
        }
    });

    const LOGS_PER_PAGE = 10;

    const totalLogPages = Math.max(
        1,
        Math.ceil(filteredLogs.length / LOGS_PER_PAGE)
    );

    const safeLogPage = Math.min(currentLogPage, totalLogPages);

    const startLogIndex = (safeLogPage - 1) * LOGS_PER_PAGE;
    const endLogIndex = startLogIndex + LOGS_PER_PAGE;

    const pagedLogs = filteredLogs.slice(startLogIndex, endLogIndex);

    const currentLogStart = filteredLogs.length === 0 ? 0 : startLogIndex + 1;
    const currentLogEnd = Math.min(endLogIndex, filteredLogs.length);

    const logPageNumbers = (() => {
        const maxButtons = 5;
        let start = Math.max(1, safeLogPage - 2);
        let end = Math.min(totalLogPages, start + maxButtons - 1);

        start = Math.max(1, end - maxButtons + 1);

        return Array.from(
            { length: end - start + 1 },
            (_, index) => start + index
        );
    })();

    return (
        <div className="mypage-container">
            <h1>마이페이지</h1>

            <div className="mypage-card mypage-profile-card">
                <div>
                    <h2>{user.username}</h2>
                    <p>이메일: {user.email}</p>
                </div>

                <div className="profile-point-box">
                    <p>현재 코인</p>
                    <strong>{formatPoint(user.coin)}P</strong>
                </div>

                <div className="profile-point-box">
                    <p>현재 잭팟</p>
                    <strong>{formatPoint(user.jackpot)}P</strong>
                </div>
            </div>

            <section className="mypage-section">
                <h2>내 플레이 통계</h2>

                <div className="stats-grid enhanced-stats-grid">
                    <div className="stat-card">
                        <span>조커 등장</span>
                        <strong>{jokerUsedCount}</strong>
                        <small>조커가 나온 판</small>
                    </div>

                    <div className="stat-card">
                        <span>조커 등장률</span>
                        <strong>{formatPercent(jokerRate)}%</strong>
                        <small>전체 게임 중 조커 등장 비율</small>
                    </div>

                    <div className="stat-card">
                        <span>조커 승리</span>
                        <strong>{jokerWinCount}</strong>
                        <small>조커 등장 후 승리한 판</small>
                    </div>

                    <div className="stat-card">
                        <span>총 플레이</span>
                        <strong>{totalGames}</strong>
                        <small>전체 게임 기록 수</small>
                    </div>

                    <div className="stat-card">
                        <span>승리</span>
                        <strong>{winGames}</strong>
                        <small>보상을 획득한 판</small>
                    </div>

                    <div className="stat-card">
                        <span>패배</span>
                        <strong>{loseGames}</strong>
                        <small>보상 0P 판</small>
                    </div>

                    <div className="stat-card primary-stat">
                        <span>승률</span>
                        <strong>{formatPercent(winRate)}%</strong>
                        <small>승리 / 총 플레이</small>
                    </div>

                    <div className="stat-card">
                        <span>총 획득 포인트</span>
                        <strong>{formatPoint(totalReward)}P</strong>
                        <small>누적 final_reward</small>
                    </div>

                    <div className="stat-card">
                        <span>최고 획득</span>
                        <strong>{formatPoint(maxReward)}P</strong>
                        <small>한 판 최고 보상</small>
                    </div>

                    <div className="stat-card">
                        <span>평균 획득</span>
                        <strong>{formatPoint(avgReward)}P</strong>
                        <small>게임당 평균 보상</small>
                    </div>

                    <div className="stat-card">
                        <span>총 배팅</span>
                        <strong>{formatPoint(totalBet)}P</strong>
                        <small>누적 배팅 포인트</small>
                    </div>

                    <div className="stat-card">
                        <span>최고 배팅</span>
                        <strong>{formatPoint(maxBet)}P</strong>
                        <small>한 판 최대 배팅</small>
                    </div>

                    <div className="stat-card">
                        <span>최다 족보</span>
                        <strong>{favoriteHand}</strong>
                        <small>{favoriteHandCount}회</small>
                    </div>

                    <div className="stat-card">
                        <span>잭팟 수령</span>
                        <strong>{jackpotUsedCount}</strong>
                        <small>잭팟을 받은 횟수</small>
                    </div>

                    <div className="stat-card">
                        <span>잭팟 적립</span>
                        <strong>{formatPoint(totalJackpotFee)}P</strong>
                        <small>누적 잭팟 적립액</small>
                    </div>
                </div>
            </section>

            <section className="mypage-section">
                <h2>미니게임 통계</h2>

                <div className="mini-stats-box">
                    <div>
                        <span>미니게임 진입</span>
                        <strong>{miniEnterCount}회</strong>
                    </div>

                    <div>
                        <span>미니게임 성공</span>
                        <strong>{miniSuccessCount}회</strong>
                    </div>

                    <div>
                        <span>미니게임 실패</span>
                        <strong>{miniFailCount}회</strong>
                    </div>

                    <div>
                        <span>성공률</span>
                        <strong>{formatPercent(miniSuccessRate)}%</strong>
                    </div>
                </div>
            </section>

            <section className="mypage-section">
                <h2>족보별 기록</h2>

                {handCounts.length === 0 ? (
                    <p className="empty-log">아직 족보 기록이 없습니다.</p>
                ) : (
                    <div className="hand-rank-list">
                        {handCounts.map((hand, index) => (
                            <div className="hand-rank-item" key={hand.hand_name}>
                                <span className="hand-rank-number">{index + 1}</span>
                                <span className="hand-rank-name">{hand.hand_name}</span>
                                <strong>{hand.count}회</strong>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <div className="log-section">
                <div className="log-section-header">
                    <div>
                        <h2>최근 게임 기록</h2>
                        <p>
                            표시 중: {currentLogStart} - {currentLogEnd} / 필터 결과 {filteredLogs.length}개
                            {" "}· 전체 {logs.length}개
                        </p>
                    </div>
                </div>

                <div className="log-filter-bar">
                    {logFilterOptions.map(option => (
                        <button
                            key={option.key}
                            className={logFilter === option.key ? "active" : ""}
                            onClick={() => {
                                setLogFilter(option.key);
                                setCurrentLogPage(1);
                            }}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                {logs.length === 0 ? (
                    <p className="empty-log">아직 게임 기록이 없습니다.</p>
                ) : filteredLogs.length === 0 ? (
                    <p className="empty-log">선택한 조건에 맞는 게임 기록이 없습니다.</p>
                ) : (
                    <>
                        <div className="log-table-wrap">
                            <table className="log-table">
                                <thead>
                                <tr>
                                    <th>날짜</th>
                                    <th>족보</th>
                                    <th>배팅</th>
                                    <th>기본 보상</th>
                                    <th>잭팟 적립</th>
                                    <th>최종 획득</th>
                                    <th>미니게임</th>
                                    <th>잭팟 사용</th>
                                    <th>조커</th>
                                </tr>
                                </thead>

                                <tbody>
                                {pagedLogs.map(log => (
                                    <tr
                                        key={log.id}
                                        className={
                                            Number(log.final_reward ?? 0) > 0
                                                ? "log-win-row clickable-log-row"
                                                : "log-lose-row clickable-log-row"
                                        }
                                        onClick={() => setSelectedLog(log)}
                                    >
                                        <td>{new Date(log.created_at).toLocaleString()}</td>
                                        <td>{log.hand_name}</td>
                                        <td>{formatPoint(log.bet)}P</td>
                                        <td>{formatPoint(log.base_reward)}P</td>
                                        <td>{formatPoint(log.jackpot_fee)}P</td>
                                        <td>{formatPoint(log.final_reward)}P</td>
                                        <td>
                        <span className={`mini-result-badge mini-${log.mini_result ?? "none"}`}>
                            {getMiniResultText(log.mini_result)}
                        </span>
                                        </td>
                                        <td>
                                            {isJackpotUsed(log) ? (
                                                <span className="jackpot-used-badge">사용</span>
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                        <td>
                                            {isJokerUsed(log) ? (
                                                <span className="joker-used-badge">등장</span>
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="log-pagination">
                            <div className="log-pagination-info">
                                {safeLogPage} / {totalLogPages} 페이지
                            </div>

                            <div className="log-pagination-buttons">
                                <button
                                    onClick={() => setCurrentLogPage(1)}
                                    disabled={safeLogPage === 1}
                                >
                                    처음
                                </button>

                                <button
                                    onClick={() => setCurrentLogPage(prev => Math.max(prev - 1, 1))}
                                    disabled={safeLogPage === 1}
                                >
                                    이전
                                </button>

                                {logPageNumbers.map(page => (
                                    <button
                                        key={page}
                                        className={safeLogPage === page ? "active" : ""}
                                        onClick={() => setCurrentLogPage(page)}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setCurrentLogPage(prev => Math.min(prev + 1, totalLogPages))}
                                    disabled={safeLogPage === totalLogPages}
                                >
                                    다음
                                </button>

                                <button
                                    onClick={() => setCurrentLogPage(totalLogPages)}
                                    disabled={safeLogPage === totalLogPages}
                                >
                                    마지막
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="button-row">
                <button onClick={() => setPage("game")}>게임으로 돌아가기</button>
                <button onClick={() => setPage("ranking")}>랭킹 보기</button>
            </div>

            {selectedLog && (
                <div className="log-detail-backdrop" onClick={() => setSelectedLog(null)}>
                    <div className="log-detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="log-detail-header">
                            <div>
                                <h2>게임 상세 기록</h2>
                                <p>{new Date(selectedLog.created_at).toLocaleString()}</p>
                            </div>

                            <button onClick={() => setSelectedLog(null)}>×</button>
                        </div>

                        <div className="log-detail-grid">
                            <div>
                                <span>족보</span>
                                <strong>{selectedLog.hand_name}</strong>
                            </div>

                            <div>
                                <span>배팅</span>
                                <strong>{formatPoint(selectedLog.bet)}P</strong>
                            </div>

                            <div>
                                <span>기본 보상</span>
                                <strong>{formatPoint(selectedLog.base_reward)}P</strong>
                            </div>

                            <div>
                                <span>잭팟 적립</span>
                                <strong>{formatPoint(selectedLog.jackpot_fee)}P</strong>
                            </div>

                            <div>
                                <span>최종 획득</span>
                                <strong>{formatPoint(selectedLog.final_reward)}P</strong>
                            </div>

                            <div>
                                <span>미니게임</span>
                                <strong>{getMiniResultText(selectedLog.mini_result)}</strong>
                            </div>

                            <div>
                                <span>잭팟 사용</span>
                                <strong>{isJackpotUsed(selectedLog) ? "사용" : "미사용"}</strong>
                            </div>

                            <div>
                                <span>조커 사용</span>
                                <strong>{Number(selectedLog.joker_used ?? 0) === 1 ? "등장" : "없음"}</strong>
                            </div>
                        </div>

                        <div className="log-final-card-area">
                            <h3>최종 카드</h3>

                            <div className="log-final-card-list">
                                {parseFinalCards(selectedLog.final_cards).length === 0 ? (
                                    <p>저장된 카드 정보가 없습니다.</p>
                                ) : (
                                    parseFinalCards(selectedLog.final_cards).map((card, index) => (
                                        <div
                                            key={index}
                                            className={`log-mini-card ${
                                                card.isJoker ? "log-joker-card" : ""
                                            } ${
                                                card.suit === "♥" || card.suit === "♦"
                                                    ? "log-red-card"
                                                    : "log-black-card"
                                            }`}
                                        >
                                            {card.isJoker ? (
                                                <>
                                                    <span>JOKER</span>
                                                    <strong>🃏</strong>
                                                </>
                                            ) : (
                                                <>
                                                    <span>{card.rank}</span>
                                                    <strong>{card.suit}</strong>
                                                </>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}


export default MyPage;