import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { API_BASE_URL } from "../api";
import MissionModal from "./MissionModal";


const suits = ["♠", "♥", "♦", "♣"];
const ranks = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];

const rankValue = {
    "A": 14,
    "K": 13,
    "Q": 12,
    "J": 11,
    "10": 10,
    "9": 9,
    "8": 8,
    "7": 7,
    "6": 6,
    "5": 5,
    "4": 4,
    "3": 3,
    "2": 2
};

const payoutTable = {
    "파이브 카드": 100,
    "로얄 스트레이트 플러시": 50,
    "스트레이트 플러시": 30,
    "포카드": 15,
    "풀하우스": 7,
    "플러시": 5,
    "스트레이트": 3,
    "트리플": 2,
    "투페어": 1,
    "원페어": 0.5,
    "노페어": 0
};

const handPower = {
    "노페어": 0,
    "원페어": 1,
    "투페어": 2,
    "트리플": 3,
    "스트레이트": 4,
    "플러시": 5,
    "풀하우스": 6,
    "포카드": 7,
    "스트레이트 플러시": 8,
    "로얄 스트레이트 플러시": 9,
    "파이브 카드": 10
};

// 잭팟 적립률: 보상/배당금의 10%를 다음 잭팟으로 적립
const JACKPOT_SAVE_RATE = 0.10;

function createDeck(includeJoker = true) {
    const deck = [];

    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({
                suit,
                rank,
                value: rankValue[rank],
                isJoker: false
            });
        }
    }

    if (includeJoker) {
        deck.push({
            suit: "🃏",
            rank: "JOKER",
            value: 0,
            isJoker: true
        });
    }

    return deck;
}

function createJokerCard() {
    return {
        suit: "🃏",
        rank: "JOKER",
        value: 0,
        isJoker: true
    };
}

function shuffleDeck(deck) {
    const newDeck = [...deck];

    for (let i = newDeck.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1));
        [newDeck[i], newDeck[randomIndex]] = [newDeck[randomIndex], newDeck[i]];
    }

    return newDeck;
}

function evaluateNormalHand(hand) {
    const values = hand.map(card => card.value).sort((a, b) => b - a);
    const cardSuits = hand.map(card => card.suit);

    const isFlush = cardSuits.every(suit => suit === cardSuits[0]);
    const uniqueValues = [...new Set(values)];

    let isStraight = false;

    if (uniqueValues.length === 5) {
        const max = uniqueValues[0];
        const min = uniqueValues[4];

        if (max - min === 4) {
            isStraight = true;
        }

        const lowStraight = [14, 5, 4, 3, 2];

        if (lowStraight.every(value => values.includes(value))) {
            isStraight = true;
        }
    }

    const countMap = {};

    for (const value of values) {
        countMap[value] = (countMap[value] || 0) + 1;
    }

    const counts = Object.values(countMap).sort((a, b) => b - a);

    const isRoyal =
        values.includes(14) &&
        values.includes(13) &&
        values.includes(12) &&
        values.includes(11) &&
        values.includes(10);

    if (isFlush && isRoyal) return "로얄 스트레이트 플러시";
    if (isFlush && isStraight) return "스트레이트 플러시";
    if (counts[0] === 4) return "포카드";
    if (counts[0] === 3 && counts[1] === 2) return "풀하우스";
    if (isFlush) return "플러시";
    if (isStraight) return "스트레이트";
    if (counts[0] === 3) return "트리플";
    if (counts[0] === 2 && counts[1] === 2) return "투페어";
    if (counts[0] === 2) return "원페어";

    return "노페어";
}

function evaluateHand(hand) {
    const hasJoker = hand.some(card => card.isJoker);

    if (!hasJoker) {
        return evaluateNormalHand(hand);
    }

    const normalCards = hand.filter(card => !card.isJoker);

    const countMap = {};

    for (const card of normalCards) {
        countMap[card.value] = (countMap[card.value] || 0) + 1;
    }

    const hasFourSameCards = Object.values(countMap).some(count => count === 4);

    if (hasFourSameCards) {
        return "파이브 카드";
    }

    let bestHandName = "노페어";

    for (const suit of suits) {
        for (const rank of ranks) {
            const jokerAsCard = {
                suit,
                rank,
                value: rankValue[rank],
                isJoker: false
            };

            const replacedHand = normalCards.concat(jokerAsCard);
            const handName = evaluateNormalHand(replacedHand);

            if (handPower[handName] > handPower[bestHandName]) {
                bestHandName = handName;
            }
        }
    }

    return bestHandName;
}

function drawRandomNormalCard() {
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const rank = ranks[Math.floor(Math.random() * ranks.length)];

    return {
        suit,
        rank,
        value: rankValue[rank],
        isJoker: false
    };
}

function drawMiniGamePair() {
    const leftCard = drawRandomNormalCard();
    let rightCard = drawRandomNormalCard();

    while (rightCard.value === leftCard.value) {
        rightCard = drawRandomNormalCard();
    }

    return {
        leftCard,
        rightCard
    };
}

function formatPoint(value) {
    return Math.round(Number(value) * 10) / 10;
}
function serializeFinalCards(cards) {
    if (!Array.isArray(cards)) return [];

    return cards.map(card => ({
        suit: card.suit,
        rank: card.rank,
        value: card.value,
        isJoker: Boolean(card.isJoker),
        label: card.isJoker ? "JOKER" : `${card.rank}${card.suit}`
    }));
}

function hasJokerCard(cards) {
    if (!Array.isArray(cards)) return false;

    return cards.some(card => card.isJoker);
}


// 여기부터 추가
function getTotalGames(user) {
    return Number(user?.win ?? 0) + Number(user?.lose_count ?? 0);
}

function getCurrentRoundNumber(user) {
    // 이미 끝난 판 수 + 1 = 이번에 시작하는 판 번호
    return getTotalGames(user) + 1;
}

function getJokerRule(roundNumber) {
    if (roundNumber % 30 === 0) {
        return "guaranteed"; // 30, 60, 90... 무조건 조커
    }

    if (roundNumber % 10 === 0) {
        return "boost"; // 10, 20, 40, 50... 45%
    }

    return "normal"; // 기존 확률
}

function getDisplayJokerRate(roundNumber) {
    const rule = getJokerRule(roundNumber);

    if (rule === "guaranteed") {
        return 1;
    }

    if (rule === "boost") {
        return 0.45;
    }

    // 기존 확률: 53장 중 첫 5장 안에 조커가 들어올 확률
    return 5 / 53;
}

function swapJokerIntoHand(firstHand, remainingDeck) {
    const jokerIndexInDeck = remainingDeck.findIndex(card => card.isJoker);

    if (jokerIndexInDeck === -1) {
        return {
            firstHand,
            remainingDeck
        };
    }

    const randomHandIndex = Math.floor(Math.random() * firstHand.length);

    const newFirstHand = [...firstHand];
    const newRemainingDeck = [...remainingDeck];

    const replacedCard = newFirstHand[randomHandIndex];

    newFirstHand[randomHandIndex] = newRemainingDeck[jokerIndexInDeck];
    newRemainingDeck[jokerIndexInDeck] = replacedCard;

    return {
        firstHand: newFirstHand,
        remainingDeck: newRemainingDeck
    };
}
// 여기까지 추가

let pokerAudioContext = null;

const getPokerAudioContext = () => {
    if (!pokerAudioContext) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        pokerAudioContext = new AudioContext();
    }

    return pokerAudioContext;
};

const primePokerAudioContext = () => {
    try {
        const audioCtx = getPokerAudioContext();

        if (audioCtx.state === "suspended") {
            void audioCtx.resume();
        }
    } catch (error) {
        console.error("효과음 준비 실패:", error);
    }
};

const playSound = (type, masterVolume = 0.7, startDelayMs = 0) => {
    try {
        if (masterVolume <= 0) return;

        const audioCtx = getPokerAudioContext();

        if (audioCtx.state === "suspended") {
            audioCtx.resume();
        }

        const baseTime = audioCtx.currentTime + Math.max(0, startDelayMs) / 1000;

        const soundPatterns = {
            click: [
                { frequency: 520, duration: 0.05, delay: 0, volume: 0.08, wave: "sine" }
            ],

            hold: [
                { frequency: 620, duration: 0.06, delay: 0, volume: 0.08, wave: "triangle" },
                { frequency: 820, duration: 0.05, delay: 0.05, volume: 0.06, wave: "triangle" }
            ],

            deal: [
                // 원래 배분 속도에 맞게 짧고 빠르게 끝나는 카드 배분음
                { frequency: 320, duration: 0.045, delay: 0, volume: 0.09, wave: "square" },
                { frequency: 420, duration: 0.035, delay: 0.025, volume: 0.055, wave: "square" }
            ],

            flip: [
                // 카드 뒤집힘과 맞도록 짧고 선명한 플립음
                { frequency: 620, duration: 0.04, delay: 0, volume: 0.075, wave: "triangle" },
                { frequency: 920, duration: 0.035, delay: 0.025, volume: 0.06, wave: "triangle" }
            ],

            exchange: [
                { frequency: 300, duration: 0.08, delay: 0, volume: 0.07, wave: "sawtooth" },
                { frequency: 220, duration: 0.08, delay: 0.07, volume: 0.06, wave: "sawtooth" }
            ],

            win: [
                { frequency: 660, duration: 0.08, delay: 0, volume: 0.08, wave: "triangle" },
                { frequency: 880, duration: 0.1, delay: 0.09, volume: 0.08, wave: "triangle" },
                { frequency: 1100, duration: 0.14, delay: 0.19, volume: 0.08, wave: "triangle" }
            ],

            fail: [
                { frequency: 240, duration: 0.12, delay: 0, volume: 0.08, wave: "sine" },
                { frequency: 160, duration: 0.18, delay: 0.11, volume: 0.08, wave: "sine" }
            ],

            jackpot: [
                { frequency: 740, duration: 0.08, delay: 0, volume: 0.09, wave: "triangle" },
                { frequency: 980, duration: 0.1, delay: 0.09, volume: 0.09, wave: "triangle" },
                { frequency: 1240, duration: 0.16, delay: 0.2, volume: 0.1, wave: "triangle" },
                { frequency: 1480, duration: 0.2, delay: 0.36, volume: 0.09, wave: "triangle" }
            ],

            mission: [
                { frequency: 600, duration: 0.08, delay: 0, volume: 0.07, wave: "triangle" },
                { frequency: 900, duration: 0.12, delay: 0.1, volume: 0.08, wave: "triangle" }
            ],

            joker: [
                { frequency: 420, duration: 0.08, delay: 0, volume: 0.08, wave: "sawtooth" },
                { frequency: 840, duration: 0.1, delay: 0.08, volume: 0.09, wave: "triangle" },
                { frequency: 1260, duration: 0.14, delay: 0.18, volume: 0.1, wave: "triangle" }
            ]
        };

        const pattern = soundPatterns[type] || soundPatterns.click;

        pattern.forEach((note) => {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = note.wave;
            oscillator.frequency.setValueAtTime(note.frequency, baseTime + note.delay);

            gainNode.gain.setValueAtTime(0.001, baseTime + note.delay);
            gainNode.gain.exponentialRampToValueAtTime(
                note.volume * masterVolume,
                baseTime + note.delay + 0.01
            );
            gainNode.gain.exponentialRampToValueAtTime(
                0.001,
                baseTime + note.delay + note.duration
            );

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start(baseTime + note.delay);
            oscillator.stop(baseTime + note.delay + note.duration + 0.03);
        });
    } catch (error) {
        console.error("효과음 재생 실패:", error);
    }
};

function getAutoHoldIndexes(hand) {
    const handName = evaluateHand(hand);

    if (handName === "노페어") {
        return [];
    }

    const jokerIndex = hand.findIndex(card => card.isJoker);
    const hasJoker = jokerIndex !== -1;

    const valueMap = {};

    hand.forEach((card, index) => {
        if (card.isJoker) return;

        if (!valueMap[card.value]) {
            valueMap[card.value] = [];
        }

        valueMap[card.value].push(index);
    });

    const sameRankGroups = Object.values(valueMap)
        .filter(group => group.length >= 2)
        .sort((a, b) => b.length - a.length);

    if (
        handName === "로얄 스트레이트 플러시" ||
        handName === "스트레이트 플러시" ||
        handName === "스트레이트" ||
        handName === "플러시"
    ) {
        return [0, 1, 2, 3, 4];
    }

    if (handName === "파이브 카드") {
        return [0, 1, 2, 3, 4];
    }

    if (handName === "포카드") {
        const fourCardGroup = sameRankGroups.find(group => group.length === 4);

        if (fourCardGroup) {
            return hasJoker ? [...fourCardGroup, jokerIndex] : fourCardGroup;
        }
    }

    if (handName === "풀하우스") {
        return [0, 1, 2, 3, 4];
    }

    if (handName === "트리플") {
        const tripleGroup = sameRankGroups.find(group => group.length === 3);

        if (tripleGroup) {
            return tripleGroup;
        }

        const pairGroup = sameRankGroups.find(group => group.length === 2);

        if (pairGroup && hasJoker) {
            return [...pairGroup, jokerIndex];
        }
    }

    if (handName === "투페어") {
        return sameRankGroups
            .filter(group => group.length === 2)
            .flat();
    }

    if (handName === "원페어") {
        const pairGroup = sameRankGroups.find(group => group.length === 2);

        if (pairGroup) {
            return pairGroup;
        }

        if (hasJoker) {
            return [jokerIndex];
        }
    }

    return [];
}

function getWinningCardIndexes(hand, handName) {
    if (!hand || hand.length === 0 || handName === "노페어") {
        return [];
    }

    const jokerIndex = hand.findIndex(card => card.isJoker);
    const hasJoker = jokerIndex !== -1;

    const valueMap = {};

    hand.forEach((card, index) => {
        if (card.isJoker) return;

        if (!valueMap[card.value]) {
            valueMap[card.value] = [];
        }

        valueMap[card.value].push(index);
    });

    const groups = Object.values(valueMap).sort((a, b) => b.length - a.length);

    if (
        handName === "로얄 스트레이트 플러시" ||
        handName === "스트레이트 플러시" ||
        handName === "스트레이트" ||
        handName === "플러시" ||
        handName === "풀하우스" ||
        handName === "파이브 카드"
    ) {
        return [0, 1, 2, 3, 4];
    }

    if (handName === "포카드") {
        const fourGroup = groups.find(group => group.length === 4);

        if (fourGroup) {
            return fourGroup;
        }

        const threeGroup = groups.find(group => group.length === 3);

        if (threeGroup && hasJoker) {
            return [...threeGroup, jokerIndex];
        }

        return [];
    }

    if (handName === "트리플") {
        const threeGroup = groups.find(group => group.length === 3);

        if (threeGroup) {
            return threeGroup;
        }

        const pairGroup = groups.find(group => group.length === 2);

        if (pairGroup && hasJoker) {
            return [...pairGroup, jokerIndex];
        }

        return [];
    }

    if (handName === "투페어") {
        const pairGroups = groups.filter(group => group.length === 2);

        if (pairGroups.length >= 2) {
            return pairGroups.slice(0, 2).flat();
        }

        if (pairGroups.length === 1 && hasJoker) {
            const pairIndexes = pairGroups[0];

            const singleCards = hand
                .map((card, index) => ({ card, index }))
                .filter(item => !item.card.isJoker && !pairIndexes.includes(item.index))
                .sort((a, b) => b.card.value - a.card.value);

            if (singleCards.length > 0) {
                return [...pairIndexes, singleCards[0].index, jokerIndex];
            }
        }

        return [];
    }

    if (handName === "원페어") {
        const pairGroup = groups.find(group => group.length === 2);

        if (pairGroup) {
            return pairGroup;
        }

        if (hasJoker) {
            const highestCard = hand
                .map((card, index) => ({ card, index }))
                .filter(item => !item.card.isJoker)
                .sort((a, b) => b.card.value - a.card.value)[0];

            if (highestCard) {
                return [highestCard.index, jokerIndex];
            }
        }

        return [];
    }

    return [];
}

function GameRuleModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="rule-modal-backdrop" onClick={onClose}>
            <div className="rule-modal" onClick={(e) => e.stopPropagation()}>
                <div className="rule-modal-header">
                    <div>
                        <h2>게임 방법</h2>
                        <p>Five Draw Poker 기본 규칙 안내</p>
                    </div>

                    <button className="rule-close-button" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="rule-modal-content">
                    <section className="rule-section">
                        <h3>기본 진행</h3>
                        <ol>
                            <li>배팅 금액을 입력하고 게임을 시작합니다.</li>
                            <li>처음에 카드 5장을 받습니다.</li>
                            <li>유지하고 싶은 카드는 클릭해서 HOLD 합니다.</li>
                            <li>HOLD 하지 않은 카드는 교환됩니다.</li>
                            <li>최종 카드 조합에 따라 보상이 결정됩니다.</li>
                        </ol>
                    </section>

                    <section className="rule-section">
                        <h3>배당표</h3>

                        <div className="rule-payout-grid">
                            <div><span>원페어</span><strong>x0.5</strong></div>
                            <div><span>투페어</span><strong>x1</strong></div>
                            <div><span>트리플</span><strong>x2</strong></div>
                            <div><span>스트레이트</span><strong>x3</strong></div>
                            <div><span>플러시</span><strong>x5</strong></div>
                            <div><span>풀하우스</span><strong>x7</strong></div>
                            <div><span>포카드</span><strong>x15</strong></div>
                            <div><span>스트레이트 플러시</span><strong>x30</strong></div>
                            <div><span>로얄 스트레이트 플러시</span><strong>x50</strong></div>
                            <div><span>파이브 카드</span><strong>x100</strong></div>
                        </div>
                    </section>

                    <section className="rule-section">
                        <h3>미니게임</h3>
                        <ul>
                            <li>투페어 이상이면 미니게임에 도전할 수 있습니다.</li>
                            <li>왼쪽 카드가 오른쪽 카드보다 높은지 낮은지 맞히는 게임입니다.</li>
                            <li>성공하면 기본 보상이 계속 2배씩 증가합니다. 예: 1연승 x2, 2연승 x4, 3연승 x8</li>
                            <li>실패하면 보상은 0P가 됩니다.</li>
                            <li>성공 후에는 계속 도전하거나 보상을 받을 수 있습니다.</li>
                        </ul>
                    </section>

                    <section className="rule-section">
                        <h3>잭팟</h3>
                        <ul>
                            <li>일반 승리 또는 보상 수령 시 최종 보상의 10%가 잭팟에 적립됩니다.</li>
                            <li>나머지 90%가 플레이어에게 지급됩니다.</li>
                            <li>풀하우스 이상이면 잭팟 판이 되며, 현재 잭팟은 미니게임 승리 횟수만큼 곱해서 별도 지급됩니다.</li>
                            <li>잭팟 판에서는 추가 잭팟 적립이 없고, 첫 미니게임에서 바로 실패하면 잭팟도 0P입니다.</li>
                        </ul>
                    </section>

                    <section className="rule-section">
                        <h3>조커 특별 라운드</h3>
                        <ul>
                            <li>일반 판에서는 기존 확률로 조커가 등장합니다.</li>
                            <li>10판, 20판, 40판, 50판처럼 10판마다 조커 확률이 45%가 됩니다.</li>
                            <li>30판, 60판, 90판처럼 30판마다 조커가 100% 확정 등장합니다.</li>
                            <li>30판은 10판 규칙보다 우선 적용됩니다.</li>
                        </ul>
                    </section>

                    <section className="rule-section">
                        <h3>미션</h3>
                        <ul>
                            <li>일일 미션, 주간 미션, 업적 미션이 있습니다.</li>
                            <li>미션을 완료하면 미션 창에서 보상을 받을 수 있습니다.</li>
                            <li>게임 중 미션을 달성하면 완료 알림이 표시됩니다.</li>
                        </ul>
                    </section>
                </div>
            </div>
        </div>
    );
}

const GAME_SAVE_VERSION = 1;
const MIN_BET = 100;

const CARD_INDEXES = [0, 1, 2, 3, 4];

// 원래 카드 배분 속도
const FAST_DEAL_INTERVAL = 180;
const FAST_FLIP_START = 1100;
const FAST_FLIP_INTERVAL = 170;
const FAST_DRAW_READY_TIME = 2100;

const FAST_EXCHANGE_OUT_BASE = 280;
const FAST_EXCHANGE_OUT_INTERVAL = 70;
const FAST_EXCHANGE_REVEAL_START = 250;
const FAST_EXCHANGE_REVEAL_INTERVAL = 80;
const FAST_EXCHANGE_FINISH_DELAY = 280;

function getGameSaveKey(userId) {
    return `pokerGameState:${userId}`;
}

function loadSavedGameState(userId) {
    if (!userId) return null;

    try {
        const saved = localStorage.getItem(getGameSaveKey(userId));
        if (!saved) return null;

        const parsed = JSON.parse(saved);

        if (parsed.version !== GAME_SAVE_VERSION) {
            localStorage.removeItem(getGameSaveKey(userId));
            return null;
        }

        // 모바일 새로고침으로 애니메이션 도중 복구될 때 안전한 단계로 바꿔줌
        if (parsed.phase === "dealing") {
            parsed.phase = "draw";
            parsed.dealtCount = 5;
            parsed.revealedCards = [0, 1, 2, 3, 4];
        }

        if (parsed.phase === "exchanging") {
            parsed.phase = "draw";
            parsed.exchangingCards = [];
            parsed.incomingCards = [];
            parsed.revealedCards = [0, 1, 2, 3, 4];
        }

        if (parsed.phase === "miniRevealing") {
            parsed.phase = "miniGame";
            parsed.miniLeftRevealed = false;
            parsed.miniMessage = "왼쪽 카드가 오른쪽 카드보다 높을까요? 낮을까요?";
        }

        return parsed;
    } catch (error) {
        console.error("게임 상태 복구 실패:", error);
        localStorage.removeItem(getGameSaveKey(userId));
        return null;
    }
}

function clearSavedGameState(userId) {
    if (!userId) return;
    localStorage.removeItem(getGameSaveKey(userId));
}

function Game({ user, setUser, setPage }) {

    const savedGameState = useMemo(() => loadSavedGameState(user?.id), [user?.id]);

    const timersRef = useRef([]);

    const addTimer = useCallback((callback, delay) => {
        const timerId = setTimeout(callback, delay);
        timersRef.current.push(timerId);
        return timerId;
    }, []);

    const clearAllTimers = useCallback(() => {
        timersRef.current.forEach(timerId => clearTimeout(timerId));
        timersRef.current = [];
    }, []);

    useEffect(() => {
        return () => {
            clearAllTimers();
        };
    }, [clearAllTimers]);

    const getPipPositions = (rank) => {
        const layouts = {
            "2": ["pip-top-center", "pip-bottom-center"],
            "3": ["pip-top-center", "pip-center", "pip-bottom-center"],
            "4": ["pip-top-left", "pip-top-right", "pip-bottom-left", "pip-bottom-right"],
            "5": ["pip-top-left", "pip-top-right", "pip-center", "pip-bottom-left", "pip-bottom-right"],
            "6": ["pip-top-left", "pip-top-right", "pip-middle-left", "pip-middle-right", "pip-bottom-left", "pip-bottom-right"],
            "7": ["pip-top-left", "pip-top-right", "pip-top-center", "pip-middle-left", "pip-middle-right", "pip-bottom-left", "pip-bottom-right"],
            "8": ["pip-top-left", "pip-top-right", "pip-top-center", "pip-middle-left", "pip-middle-right", "pip-bottom-center", "pip-bottom-left", "pip-bottom-right"],
            "9": ["pip-top-left", "pip-top-right", "pip-top-center", "pip-middle-left", "pip-middle-right", "pip-center", "pip-bottom-center", "pip-bottom-left", "pip-bottom-right"],
            "10": ["pip-top-left", "pip-top-right", "pip-top-center", "pip-upper-center", "pip-middle-left", "pip-middle-right", "pip-lower-center", "pip-bottom-center", "pip-bottom-left", "pip-bottom-right"]
        };

        return layouts[rank] || [];
    };

    const isNumberCard = (rank) => {
        return ["2", "3", "4", "5", "6", "7", "8", "9", "10"].includes(rank);
    };

    const isFaceCard = (rank) => {
        return ["J", "Q", "K"].includes(rank);
    };

    const renderFaceIllustration = (rank, suit) => {
        const isRed = suit === "♥" || suit === "♦";
        const accent = isRed ? "#c91d1d" : "#111111";
        const soft = isRed ? "#f8dddd" : "#eeeeee";
        const bg = isRed ? "#fff4f4" : "#f7f7f7";

        const titleMap = {
            J: "JACK",
            Q: "QUEEN",
            K: "KING"
        };

        const title = titleMap[rank] || "";

        return (
            <div className={`face-card-center face-${rank.toLowerCase()}`}>
                <div className="face-card-banner">{title}</div>

                <svg viewBox="0 0 120 120" className="face-svg" aria-hidden="true">
                    {/* 카드 안쪽 일러스트 배경 */}
                    <rect
                        x="12"
                        y="12"
                        width="96"
                        height="96"
                        rx="12"
                        fill="#fffdfa"
                        stroke="#dddddd"
                        strokeWidth="2"
                    />

                    <rect
                        x="20"
                        y="20"
                        width="80"
                        height="80"
                        rx="10"
                        fill={bg}
                    />

                    {/* 얼굴 */}
                    <circle
                        cx="60"
                        cy="42"
                        r="13"
                        fill="#fff7ef"
                        stroke={accent}
                        strokeWidth="2.4"
                    />

                    {/* 몸통 */}
                    <path
                        d="M38 88 Q60 60 82 88"
                        fill={soft}
                        stroke={accent}
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* 목 장식 */}
                    <path
                        d="M48 58 L60 69 L72 58"
                        fill="none"
                        stroke={accent}
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* 얼굴 선 */}
                    <path
                        d="M54 43 Q60 47 66 43"
                        fill="none"
                        stroke={accent}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        opacity="0.8"
                    />

                    {/* J 전용: 모자 + 깃털 + 창 */}
                    {rank === "J" && (
                        <>
                            <path
                                d="M43 29 Q60 17 77 29 L73 36 Q60 29 47 36 Z"
                                fill={soft}
                                stroke={accent}
                                strokeWidth="2.2"
                                strokeLinejoin="round"
                            />

                            <path
                                d="M76 27 Q84 21 90 28 Q83 30 79 37"
                                fill="none"
                                stroke={accent}
                                strokeWidth="2.1"
                                strokeLinecap="round"
                            />

                            <path
                                d="M80 43 L89 80"
                                stroke={accent}
                                strokeWidth="3"
                                strokeLinecap="round"
                            />

                            <path
                                d="M75 46 L84 42"
                                stroke={accent}
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                        </>
                    )}

                    {/* Q 전용: 왕관 + 장식 */}
                    {rank === "Q" && (
                        <>
                            <polygon
                                points="43,30 50,19 60,29 70,19 77,30 77,36 43,36"
                                fill={soft}
                                stroke={accent}
                                strokeWidth="2.2"
                                strokeLinejoin="round"
                            />

                            <circle cx="50" cy="19" r="2.4" fill={accent} />
                            <circle cx="60" cy="29" r="2.4" fill={accent} />
                            <circle cx="70" cy="19" r="2.4" fill={accent} />

                            <circle cx="45" cy="46" r="2.3" fill={accent} />
                            <circle cx="75" cy="46" r="2.3" fill={accent} />

                            <path
                                d="M43 73 Q60 82 77 73"
                                fill="none"
                                stroke={accent}
                                strokeWidth="2"
                                strokeLinecap="round"
                                opacity="0.7"
                            />
                        </>
                    )}

                    {/* K 전용: 왕관 + 홀 */}
                    {rank === "K" && (
                        <>
                            <polygon
                                points="40,30 47,17 56,28 60,17 64,28 73,17 80,30 80,36 40,36"
                                fill={soft}
                                stroke={accent}
                                strokeWidth="2.2"
                                strokeLinejoin="round"
                            />

                            <circle cx="47" cy="17" r="2.4" fill={accent} />
                            <circle cx="60" cy="17" r="2.4" fill={accent} />
                            <circle cx="73" cy="17" r="2.4" fill={accent} />

                            <path
                                d="M86 36 L86 78"
                                stroke={accent}
                                strokeWidth="3"
                                strokeLinecap="round"
                            />

                            <circle
                                cx="86"
                                cy="32"
                                r="4"
                                fill="none"
                                stroke={accent}
                                strokeWidth="2.4"
                            />

                            <path
                                d="M82 78 L90 78"
                                stroke={accent}
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                        </>
                    )}

                    {/* 아래쪽 은은한 랭크 표시 */}
                    <text
                        x="60"
                        y="101"
                        textAnchor="middle"
                        fontSize="17"
                        fontWeight="900"
                        fill={accent}
                        opacity="0.16"
                    >
                        {rank}
                    </text>
                </svg>
            </div>
        );
    };

    const renderCardCenter = (rank, suit) => {
        if (rank === "A") {
            return (
                <div className="ace-center">
                    <div className="ace-suit">{suit}</div>
                </div>
            );
        }

        if (isFaceCard(rank)) {
            return renderFaceIllustration(rank, suit);
        }

        if (isNumberCard(rank)) {
            const positions = getPipPositions(rank);

            return (
                <div className="card-pips">
                    {positions.map((position, index) => (
                        <span key={index} className={`card-pip ${position}`}>
                        {suit}
                    </span>
                    ))}
                </div>
            );
        }

        return null;
    };
    const renderMiniCard = (card, isRevealed, extraClass = "") => {
        if (!card) {
            return <div className="card mini-card card-placeholder"></div>;
        }

        return (
            <div
                className={`card mini-card ${extraClass}
                ${card.isJoker && isRevealed ? "joker-card" : ""}
                ${(card.suit === "♥" || card.suit === "♦") && isRevealed ? "red-card" : ""}
                ${(card.suit === "♠" || card.suit === "♣") && isRevealed ? "black-card" : ""}
                ${isRevealed ? "card-reveal" : "card-hidden"}
            `}
            >
                {!isRevealed ? (
                    <div className="card-back-design"></div>
                ) : (
                    <>
                        {card.isJoker ? (
                            <div className="joker-face">
                                <div className="joker-top">JOKER</div>
                                <div className="joker-center">🃏</div>
                                <div className="joker-bottom">JOKER</div>
                            </div>
                        ) : (
                            <div className="card-face">
                                <div className="card-corner corner-top-left">
                                    <span className="corner-rank">{card.rank}</span>
                                    <span className="corner-suit">{card.suit}</span>
                                </div>

                                {renderCardCenter(card.rank, card.suit)}

                                <div className="card-corner corner-bottom-right">
                                    <span className="corner-rank">{card.rank}</span>
                                    <span className="corner-suit">{card.suit}</span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };

    const saveUserData = async (updatedUser, options = {}) => {
        const { applyLocal = true } = options;

        const toSafePoint = (value) => {
            const numberValue = Number(value ?? 0);
            return Number.isFinite(numberValue) ? formatPoint(numberValue) : 0;
        };

        try {
            const normalizedUser = {
                ...updatedUser,
                coin: toSafePoint(updatedUser.coin),
                jackpot: toSafePoint(updatedUser.jackpot),
                win: Number(updatedUser.win ?? 0),
                lose_count: Number(updatedUser.lose_count ?? 0)
            };

            const response = await fetch(`${API_BASE_URL}/update-user`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id: normalizedUser.id,
                    coin: normalizedUser.coin,
                    jackpot: normalizedUser.jackpot,
                    win: normalizedUser.win,
                    lose_count: normalizedUser.lose_count
                })
            });

            let data = null;

            try {
                data = await response.json();
            } catch {
                data = null;
            }

            if (!response.ok) {
                console.error("유저 정보 저장 실패:", data);
                setResult(data?.message || "유저 정보 저장에 실패했습니다.");
                return false;
            }

            if (applyLocal) {
                const currentCoin = Number(user?.coin ?? 0);
                const currentJackpot = Number(user?.jackpot ?? 0);
                const currentWin = Number(user?.win ?? 0);
                const currentLose = Number(user?.lose_count ?? 0);

                const hasChanged =
                    currentCoin !== normalizedUser.coin ||
                    currentJackpot !== normalizedUser.jackpot ||
                    currentWin !== normalizedUser.win ||
                    currentLose !== normalizedUser.lose_count;

                if (hasChanged) {
                    setUser(normalizedUser);
                    localStorage.setItem("pokerUser", JSON.stringify(normalizedUser));
                }
            }

            return true;
        } catch (error) {
            console.error("유저 정보 저장 오류:", error);
            setResult("서버와 연결할 수 없어 돈 저장에 실패했습니다.");
            return false;
        }
    };

    const saveGameLog = async ({
                                   handNameValue,
                                   baseRewardValue,
                                   jackpotFeeValue,
                                   finalReward,
                                   usedMiniGameValue,
                                   miniResult,
                                   jackpotUsedValue,
                                   finalCardsValue = hand
                               }) => {
        try {
            await fetch(`${API_BASE_URL}/game-log`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user_id: user.id,
                    username: user.username,
                    bet: Number(bet),
                    hand_name: handNameValue,
                    base_reward: baseRewardValue,
                    jackpot_fee: jackpotFeeValue,
                    final_reward: finalReward,
                    used_mini_game: usedMiniGameValue,
                    mini_result: miniResult,
                    jackpot_used: jackpotUsedValue,
                    final_cards: serializeFinalCards(finalCardsValue),
                    joker_used: hasJokerCard(finalCardsValue)
                })
            });
        } catch (error) {
            console.error("게임 기록 저장 실패:", error);
        }
    };

    const [deck, setDeck] = useState(savedGameState?.deck ?? []);
    const [hand, setHand] = useState(savedGameState?.hand ?? []);
    const [heldCards, setHeldCards] = useState(savedGameState?.heldCards ?? []);
    const [dealtCount, setDealtCount] = useState(savedGameState?.dealtCount ?? 0);
    const [revealedCards, setRevealedCards] = useState(savedGameState?.revealedCards ?? []);
    const [phase, setPhase] = useState(savedGameState?.phase ?? "ready");
    const [exchangingCards, setExchangingCards] = useState(savedGameState?.exchangingCards ?? []);
    const [incomingCards, setIncomingCards] = useState(savedGameState?.incomingCards ?? []);
    const [winningCards, setWinningCards] = useState(savedGameState?.winningCards ?? []);

    const rewardProcessingRef = useRef(false);
    const [isRewardProcessing, setIsRewardProcessing] = useState(false);

    const resetRewardProcessing = () => {
        rewardProcessingRef.current = false;
        setIsRewardProcessing(false);
    };

    const [result, setResult] = useState(savedGameState?.result ?? "");
    const [bet, setBet] = useState(() => {
        const savedBet = Number(savedGameState?.bet ?? MIN_BET);
        return savedBet >= MIN_BET ? savedBet : MIN_BET;
    });


    useEffect(() => {
        refreshUserData();
    }, [user?.id]);


    const refreshUserData = async () => {
        if (!user?.id) return;

        try {
            const response = await fetch(`${API_BASE_URL}/user/${user.id}`);
            const data = await response.json();

            if (response.ok) {
                const freshUser = {
                    ...data.user,
                    coin: formatPoint(Number(data.user.coin ?? 0)),
                    jackpot: formatPoint(Number(data.user.jackpot ?? 0)),
                    win: Number(data.user.win ?? 0),
                    lose_count: Number(data.user.lose_count ?? 0)
                };

                const hasChanged =
                    Number(user?.coin ?? 0) !== freshUser.coin ||
                    Number(user?.jackpot ?? 0) !== freshUser.jackpot ||
                    Number(user?.win ?? 0) !== freshUser.win ||
                    Number(user?.lose_count ?? 0) !== freshUser.lose_count;

                if (hasChanged) {
                    setUser(freshUser);
                    localStorage.setItem("pokerUser", JSON.stringify(freshUser));
                }

                setJackpot(prevJackpot => {
                    const currentJackpot = Number(prevJackpot ?? 0);
                    return currentJackpot === freshUser.jackpot ? prevJackpot : freshUser.jackpot;
                });
            }
        } catch (error) {
            console.error("유저 정보 새로고침 실패:", error);
        }
    };

    const [jackpot, setJackpot] = useState(savedGameState?.jackpot ?? user?.jackpot ?? 0);

    const [baseReward, setBaseReward] = useState(savedGameState?.baseReward ?? 0);

    const [currentReward, setCurrentReward] = useState(savedGameState?.currentReward ?? 0);
    const [lastHandName, setLastHandName] = useState(savedGameState?.lastHandName ?? "");
    const [resultDetail, setResultDetail] = useState(savedGameState?.resultDetail ?? null);

    // 잭팟/미니게임 보상 계산용 상태
    const [jackpotBonus, setJackpotBonus] = useState(savedGameState?.jackpotBonus ?? 0);
    const [miniRewardOrigin, setMiniRewardOrigin] = useState(savedGameState?.miniRewardOrigin ?? 0);
    const [miniWinStreak, setMiniWinStreak] = useState(savedGameState?.miniWinStreak ?? 0);

    const [miniLeftCard, setMiniLeftCard] = useState(savedGameState?.miniLeftCard ?? null);
    const [miniRightCard, setMiniRightCard] = useState(savedGameState?.miniRightCard ?? null);
    const [miniMessage, setMiniMessage] = useState(savedGameState?.miniMessage ?? "");
    const [usedMiniGame, setUsedMiniGame] = useState(savedGameState?.usedMiniGame ?? false);
    const [miniLeftRevealed, setMiniLeftRevealed] = useState(savedGameState?.miniLeftRevealed ?? false);
    const [miniSelectedGuess, setMiniSelectedGuess] = useState(savedGameState?.miniSelectedGuess ?? "");

    const [showMissionModal, setShowMissionModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showRuleModal, setShowRuleModal] = useState(false);


    const [soundEnabled, setSoundEnabled] = useState(() => {
        return localStorage.getItem("pokerSoundEnabled") !== "false";
    });

    const [soundVolume, setSoundVolume] = useState(() => {
        return Number(localStorage.getItem("pokerSoundVolume") ?? 0.7);
    });

    const [uiTheme, setUiTheme] = useState(() => {
        return localStorage.getItem("pokerUiTheme") || "casino";
    });

    const [cardDesign, setCardDesign] = useState(() => {
        return localStorage.getItem("pokerCardDesign") || "classic";
    });

    const [missionNotice, setMissionNotice] = useState(null);
    const [supportMessage, setSupportMessage] = useState("");

    useEffect(() => {
        localStorage.setItem("pokerSoundEnabled", String(soundEnabled));
        localStorage.setItem("pokerSoundVolume", String(soundVolume));
        localStorage.setItem("pokerUiTheme", uiTheme);
        localStorage.setItem("pokerCardDesign", cardDesign);
    }, [soundEnabled, soundVolume, uiTheme, cardDesign]);

    useEffect(() => {
        if (!user?.id) return;

        if (phase === "ready") {
            clearSavedGameState(user.id);
            return;
        }

        // 애니메이션 중에는 localStorage 저장을 건너뜀.
        // 돈 저장 안정성을 위해 DB 저장은 유지하고, 화면 상태 저장만 줄여서 버벅임을 줄임.
        const skipSavePhases = ["dealing", "exchanging", "miniRevealing"];

        if (skipSavePhases.includes(phase)) {
            return;
        }

        const timerId = setTimeout(() => {
            const gameState = {
                version: GAME_SAVE_VERSION,
                savedAt: Date.now(),

                deck,
                hand,
                heldCards,
                dealtCount,
                revealedCards,
                phase,
                exchangingCards: [],
                incomingCards: [],
                winningCards,

                result,
                bet,
                jackpot,
                baseReward,
                currentReward,
                lastHandName,
                resultDetail,
                jackpotBonus,
                miniRewardOrigin,
                miniWinStreak,

                miniLeftCard,
                miniRightCard,
                miniMessage,
                usedMiniGame,
                miniLeftRevealed,
                miniSelectedGuess
            };

            try {
                localStorage.setItem(getGameSaveKey(user.id), JSON.stringify(gameState));
            } catch (error) {
                console.error("게임 상태 저장 실패:", error);
            }
        }, 300);

        return () => clearTimeout(timerId);
    }, [
        user?.id,
        deck,
        hand,
        heldCards,
        phase,
        winningCards,
        result,
        bet,
        jackpot,
        baseReward,
        currentReward,
        lastHandName,
        resultDetail,
        jackpotBonus,
        miniRewardOrigin,
        miniWinStreak,
        miniLeftCard,
        miniRightCard,
        miniMessage,
        usedMiniGame,
        miniLeftRevealed,
        miniSelectedGuess
    ]);

    const playGameSound = (type, startDelayMs = 0) => {
        if (!soundEnabled) return;
        playSound(type, soundVolume, startDelayMs);
    };

    const [jokerOverlay, setJokerOverlay] = useState(null);

    const handleLogout = () => {
        clearSavedGameState(user?.id);
        localStorage.removeItem("pokerUser");
        localStorage.setItem("pokerPage", "login");
        setUser(null);
        setPage("login");
    };

    const getNotifiedMissionKeys = () => {
        const saved = localStorage.getItem(`pokerMissionNotices:${user.id}`);
        return saved ? JSON.parse(saved) : [];
    };

    const saveNotifiedMissionKeys = (keys) => {
        localStorage.setItem(`pokerMissionNotices:${user.id}`, JSON.stringify(keys));
    };

    const showMissionNotice = (notice) => {
        playGameSound("mission");

        setMissionNotice(notice);

        setTimeout(() => {
            setMissionNotice(null);
        }, 3500);
    };

    const checkMissionNotices = async () => {
        if (!user?.id) return;

        try {
            const response = await fetch(`${API_BASE_URL}/missions/${user.id}`);
            const data = await response.json();

            if (!response.ok || !data.missions) return;

            const missions = data.missions;
            const notifiedKeys = getNotifiedMissionKeys();
            const newNotices = [];

            missions.daily.missions.forEach((mission) => {
                if (mission.completed) {
                    newNotices.push({
                        key: `daily:${missions.daily.periodKey}:${mission.key}`,
                        title: "미션 완료!",
                        text: mission.title,
                        subText: "미션 창에서 보상을 확인하세요!"
                    });
                }
            });

            if (missions.daily.allCompleted && !missions.daily.claimed) {
                newNotices.push({
                    key: `daily-reward:${missions.daily.periodKey}`,
                    title: "일일 미션 전체 완료!",
                    text: `일일 보상 ${missions.daily.reward}P를 받을 수 있습니다.`,
                    subText: "미션 창에서 보상을 받아주세요!"
                });
            }

            missions.weekly.missions.forEach((mission) => {
                if (mission.completed) {
                    newNotices.push({
                        key: `weekly:${missions.weekly.periodKey}:${mission.key}`,
                        title: "주간 미션 완료!",
                        text: mission.title,
                        subText: "미션 창에서 보상을 확인하세요!"
                    });
                }
            });

            if (missions.weekly.allCompleted && !missions.weekly.claimed) {
                newNotices.push({
                    key: `weekly-reward:${missions.weekly.periodKey}`,
                    title: "주간 미션 전체 완료!",
                    text: `주간 보상 ${missions.weekly.reward}P를 받을 수 있습니다.`,
                    subText: "미션 창에서 보상을 받아주세요!"
                });
            }

            missions.achievements.forEach((mission) => {
                if (mission.completed && !mission.claimed) {
                    newNotices.push({
                        key: `achievement:${mission.key}`,
                        title: "업적 달성!",
                        text: mission.title,
                        subText: `보상 ${mission.reward}P를 받을 수 있습니다.`
                    });
                }
            });

            const firstNewNotice = newNotices.find(
                notice => !notifiedKeys.includes(notice.key)
            );

            if (!firstNewNotice) return;

            const updatedKeys = [...notifiedKeys, firstNewNotice.key];
            saveNotifiedMissionKeys(updatedKeys);
            showMissionNotice(firstNewNotice);
        } catch (error) {
            console.error("미션 알림 확인 실패:", error);
        }
    };

    const claimDailySupport = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/daily-support`, {
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
                const freshUser = {
                    ...data.user,
                    coin: Number(data.user.coin ?? 0),
                    jackpot: Number(data.user.jackpot ?? 0),
                    win: Number(data.user.win ?? 0),
                    lose_count: Number(data.user.lose_count ?? 0)
                };

                setUser(freshUser);
                setJackpot(freshUser.jackpot);
                localStorage.setItem("pokerUser", JSON.stringify(freshUser));
                setSupportMessage(data.message);
            } else {
                setSupportMessage(data.message || "지원금 수령 실패");
            }
        } catch (error) {
            console.error("지원금 수령 실패:", error);
            setSupportMessage("지원금 수령 중 오류가 발생했습니다.");
        }
    };

    useEffect(() => {
        if (phase !== "result") return;
        if (!user?.id) return;

        const timer = setTimeout(() => {
            checkMissionNotices();
        }, 700);

        return () => clearTimeout(timer);
    }, [phase, resultDetail, user?.id]);

    const roundInfo = useMemo(() => {
        const totalGamesValue = getTotalGames(user);
        const roundNumber = totalGamesValue + 1;
        const jokerRule = getJokerRule(roundNumber);
        const jokerRate = getDisplayJokerRate(roundNumber);

        const isBoost = jokerRule === "boost";
        const isGuaranteed = jokerRule === "guaranteed";

        return {
            totalGames: totalGamesValue,
            currentRoundNumber: roundNumber,
            currentJokerRate: jokerRate,
            currentJokerRule: jokerRule,
            isJokerBoostRound: isBoost,
            isJokerGuaranteedRound: isGuaranteed,
            jokerRoundTitle: isGuaranteed
                ? "JOKER FEVER ROUND"
                : isBoost
                    ? "JOKER CHANCE ROUND"
                    : "",
            jokerRoundMessage: isGuaranteed
                ? `${roundNumber}판! 이번 판은 조커 확정 등장입니다.`
                : isBoost
                    ? `${roundNumber}판! 이번 판은 조커 등장 확률이 45%입니다.`
                    : ""
        };
    }, [user?.win, user?.lose_count]);

    const {
        totalGames,
        currentRoundNumber,
        currentJokerRate,
        currentJokerRule,
        isJokerBoostRound,
        isJokerGuaranteedRound,
        jokerRoundTitle,
        jokerRoundMessage
    } = roundInfo;

    if (!user) {
        return (
            <div className="auth-container">
                <h2>로그인이 필요합니다.</h2>
                <button onClick={() => setPage("login")}>로그인으로 이동</button>
            </div>
        );
    }

    const startGame = async () => {
        if (phase !== "ready" && phase !== "result") return;

        if (!user) {
            setResult("로그인이 필요합니다.");
            return;
        }

        const numericBet = Number(bet);

        if (!numericBet || numericBet < MIN_BET) {
            setBet(MIN_BET);
            setResult(`배팅 금액은 ${MIN_BET}포인트 이상 입력해주세요.`);
            return;
        }

        if (numericBet > Number(user.coin ?? 0)) {
            setBet(Number(user.coin ?? 0));
            setResult("보유 코인보다 큰 금액은 배팅할 수 없습니다.");
            return;
        }

        clearAllTimers();
        // 사용자가 버튼을 누른 직후 오디오 컨텍스트를 미리 깨워둠.
        // 이렇게 해야 setTimeout으로 5번 재생할 때 일부 소리가 씹히는 현상이 줄어듦.
        primePokerAudioContext();

        const roundNumber = getCurrentRoundNumber(user);
        const jokerRule = getJokerRule(roundNumber);
        const jokerRate = getDisplayJokerRate(roundNumber);

        if (jokerRule !== "normal") {
            setJokerOverlay({
                type: jokerRule,
                title: jokerRule === "guaranteed" ? "JOKER FEVER!" : "JOKER CHANCE!",
                message:
                    jokerRule === "guaranteed"
                        ? `${roundNumber}판! 이번 판은 조커 확정 등장!`
                        : `${roundNumber}판! 이번 판은 조커 등장 확률 45%!`,
                rate: `${(jokerRate * 100).toFixed(0)}%`
            });

            addTimer(() => {
                setJokerOverlay(null);
            }, 1200);
        }

        let shuffledDeck;
        let firstHand;
        let remainingDeck;
        let shouldShowJoker = false;

        if (jokerRule === "normal") {
            shuffledDeck = shuffleDeck(createDeck(true));
            firstHand = shuffledDeck.slice(0, 5);
            remainingDeck = shuffledDeck.slice(5);
            shouldShowJoker = firstHand.some(card => card.isJoker);
        } else {
            shuffledDeck = shuffleDeck(createDeck(false));
            firstHand = shuffledDeck.slice(0, 5);
            remainingDeck = shuffledDeck.slice(5);

            if (jokerRule === "guaranteed") {
                shouldShowJoker = true;
            } else if (jokerRule === "boost") {
                shouldShowJoker = Math.random() < 0.45;
            }

            if (shouldShowJoker) {
                const randomIndex = Math.floor(Math.random() * firstHand.length);
                firstHand[randomIndex] = createJokerCard();
            }
        }

        const jokerIndexInHand = firstHand.findIndex(card => card.isJoker);

        if (jokerIndexInHand !== -1) {
            addTimer(() => {
                playGameSound("joker");
            }, FAST_FLIP_START + jokerIndexInHand * FAST_FLIP_INTERVAL + 120);
        }

        const updatedUser = {
            ...user,
            coin: formatPoint(Number(user.coin ?? 0) - numericBet),
            jackpot: jackpot
        };

        const saved = await saveUserData(updatedUser);

        if (!saved) {
            return;
        }

        setDeck(remainingDeck);
        setHand(firstHand);
        setHeldCards([]);
        setDealtCount(0);
        setRevealedCards([]);
        setExchangingCards([]);
        setIncomingCards([]);
        setWinningCards([]);
        setResult("");

        resetRewardProcessing();

        setBaseReward(0);
        setCurrentReward(0);
        setLastHandName("");
        setResultDetail(null);
        setJackpotBonus(0);
        setMiniRewardOrigin(0);
        setMiniWinStreak(0);
        setMiniLeftCard(null);
        setMiniRightCard(null);
        setMiniMessage("");
        setUsedMiniGame(false);
        setMiniLeftRevealed(false);
        setMiniSelectedGuess("");
        setPhase("dealing");

        // 소리는 setTimeout 실행 타이밍에 맡기지 않고 WebAudio에 먼저 예약한다.
        // 이렇게 해야 5번째 카드 소리가 렌더링/상태 변경에 밀려서 씹히지 않는다.
        for (let i = 0; i < 5; i++) {
            playGameSound("deal", i * FAST_DEAL_INTERVAL);
        }

        for (let i = 0; i < 5; i++) {
            playGameSound("flip", FAST_FLIP_START + i * FAST_FLIP_INTERVAL);
        }

        for (let i = 0; i < 5; i++) {
            addTimer(() => {
                setDealtCount(i + 1);
            }, i * FAST_DEAL_INTERVAL);
        }

        for (let i = 0; i < 5; i++) {
            addTimer(() => {
                setRevealedCards(prev => {
                    if (prev.includes(i)) return prev;
                    return [...prev, i];
                });
            }, FAST_FLIP_START + i * FAST_FLIP_INTERVAL);
        }

        addTimer(() => {
            const autoHoldIndexes = getAutoHoldIndexes(firstHand);
            setHeldCards(autoHoldIndexes);
            setPhase("draw");
        }, FAST_DRAW_READY_TIME);
    };

    const toggleHoldCard = (index) => {
        if (phase !== "draw") return;
        if (revealedCards.length < 5) return;

        playGameSound("hold");

        if (heldCards.includes(index)) {
            setHeldCards(heldCards.filter(cardIndex => cardIndex !== index));
        } else {
            setHeldCards([...heldCards, index]);
        }
    };

    const finishExchangeResult = async (newHand, newDeck) => {
        const handName = evaluateHand(newHand);
        const multiplier = payoutTable[handName];

        const winningIndexes = getWinningCardIndexes(newHand, handName);
        setWinningCards(winningIndexes);

        const rawReward = formatPoint(Number(bet) * multiplier);

        const isMiniGameTarget = handPower[handName] >= handPower["투페어"];
        const isJackpotHand = handPower[handName] >= handPower["풀하우스"];

        const jackpotBonusValue = isJackpotHand ? formatPoint(jackpot) : 0;

        // 잭팟 판은 잭팟 금액을 현재 보상에 섞지 않는다.
        // 기본 배당만 미니게임 대상이 되고, 잭팟은 미니게임 연승 수에 따라 별도로 지급한다.
        // 예: 잭팟 1000P, 미니게임 3연승 후 실패 -> 잭팟 1000P x 3 지급
        const rewardBeforeFee = rawReward;

        // 잭팟 판에서는 잭팟 적립을 하지 않는다.
        // 기존 잭팟은 jackpotBonusValue로 따로 보관하고, 현재 잭팟 풀은 0으로 초기화한다.
        const rewardAfterSafetyFee = rawReward;
        const jackpotAfterHit = isJackpotHand ? 0 : jackpot;

        setBaseReward(rawReward);
        setCurrentReward(rewardAfterSafetyFee);
        setMiniRewardOrigin(rewardAfterSafetyFee);
        setMiniWinStreak(0);
        setJackpotBonus(jackpotBonusValue);
        setLastHandName(handName);
        setUsedMiniGame(false);

        setHand(newHand);
        setDeck(newDeck);
        setHeldCards([]);
        setDealtCount(5);
        setRevealedCards([0, 1, 2, 3, 4]);
        setExchangingCards([]);
        setIncomingCards([]);

        if (isMiniGameTarget) {
            // 여기서는 DB 저장하지 않음.
            // 미니게임 도전 여부가 끝나기 전이라 저장하면 중간에 렌더링/통신이 끼어서 버벅일 수 있음.
            // 실제 돈/잭팟 저장은 takeReward 또는 finishAfterFail에서 한 번만 처리.
            setJackpot(jackpotAfterHit);

            if (isJackpotHand) {
                setResult(
                    `${handName}! 기본 배당 ${rawReward}P / 잭팟 대상 ${jackpotBonusValue}P / 잭팟 판은 추가 적립 없음 / 현재 기본 획득 예정 ${rewardAfterSafetyFee}P`
                );
            } else {
                setResult(
                    `${handName}! 기본 배당 ${rawReward}P / 현재 획득 예정 ${rewardAfterSafetyFee}P`
                );
            }

            setPhase("miniChoice");
            return;
        }

        // 미니게임이 없는 낮은 족보는 최종 보상의 10%를 잭팟에 적립한다.
        const fee = formatPoint(rewardBeforeFee * JACKPOT_SAVE_RATE);
        const netReward = formatPoint(rewardBeforeFee - fee);
        const updatedJackpot = formatPoint(jackpot + fee);
        const isWin = netReward > 0;

        if (isWin) {
            playGameSound("win");
        } else {
            playGameSound("fail");
        }

        setJackpot(updatedJackpot);
        setCurrentReward(netReward);

        const updatedUser = {
            ...user,
            coin: formatPoint(Number(user.coin ?? 0) + netReward),
            jackpot: updatedJackpot,
            win: isWin ? Number(user.win ?? 0) + 1 : Number(user.win ?? 0),
            lose_count: isWin ? Number(user.lose_count ?? 0) : Number(user.lose_count ?? 0) + 1
        };

        const saved = await saveUserData(updatedUser);

        if (!saved) {
            return;
        }

        void saveGameLog({
            handNameValue: handName,
            baseRewardValue: rawReward,
            jackpotFeeValue: fee,
            finalReward: netReward,
            usedMiniGameValue: false,
            miniResult: "none",
            jackpotUsedValue: false,
            finalCardsValue: newHand
        });

        setResultDetail({
            handName: handName,
            bet: Number(bet),
            baseReward: rawReward,
            jackpotFee: fee,
            finalReward: netReward,
            usedMiniGame: false,
            miniResult: "none",
            jackpotUsed: false,
            jackpotBonus: 0,
            miniWinStreak: 0
        });

        setResult(
            `${handName}! 기본 배당 ${rawReward}P / 잭팟 적립 ${fee}P / 실제 획득 ${netReward}P`
        );

        setPhase("result");
    };

    const exchangeCards = () => {
        if (phase !== "draw") return;

        clearAllTimers();

        const heldSet = new Set(heldCards);
        const exchangeIndexes = CARD_INDEXES.filter(index => !heldSet.has(index));

        if (exchangeIndexes.length === 0) {
            finishExchangeResult(hand, deck);
            return;
        }

        playGameSound("exchange");

        const newDeck = [...deck];
        const newHand = [...hand];

        exchangeIndexes.forEach(index => {
            newHand[index] = newDeck.shift();
        });

        setPhase("exchanging");
        setExchangingCards(exchangeIndexes);
        setResult("카드를 교환하는 중입니다...");

        const outAnimationTime =
            FAST_EXCHANGE_OUT_BASE + exchangeIndexes.length * FAST_EXCHANGE_OUT_INTERVAL;

        addTimer(() => {
            setHand(newHand);
            setDeck(newDeck);
            setExchangingCards([]);
            setIncomingCards(exchangeIndexes);

            const exchangeSet = new Set(exchangeIndexes);

            setRevealedCards(prev =>
                prev.filter(index => !exchangeSet.has(index))
            );

            exchangeIndexes.forEach((index, order) => {
                addTimer(() => {
                    if (order === 0 || order === exchangeIndexes.length - 1) {
                        playGameSound("flip");
                    }

                    setRevealedCards(prev => {
                        if (prev.includes(index)) return prev;
                        return [...prev, index];
                    });
                }, FAST_EXCHANGE_REVEAL_START + order * FAST_EXCHANGE_REVEAL_INTERVAL);
            });

            const revealFinishTime =
                FAST_EXCHANGE_REVEAL_START +
                exchangeIndexes.length * FAST_EXCHANGE_REVEAL_INTERVAL +
                FAST_EXCHANGE_FINISH_DELAY;

            addTimer(() => {
                finishExchangeResult(newHand, newDeck);
            }, revealFinishTime);
        }, outAnimationTime);
    };

    const takeReward = async () => {
        if (!["miniChoice", "miniSuccess"].includes(phase)) return;

        if (rewardProcessingRef.current) return;

        rewardProcessingRef.current = true;
        setIsRewardProcessing(true);

        try {
            const isJackpotHand = handPower[lastHandName] >= handPower["풀하우스"];

            const jackpotMultiplier = isJackpotHand
                ? (usedMiniGame ? miniWinStreak : 1)
                : 0;

            const jackpotPayout = isJackpotHand
                ? formatPoint(Number(jackpotBonus) * jackpotMultiplier)
                : 0;

            const jackpotUsedValue = isJackpotHand && jackpotPayout > 0;

            const fee = isJackpotHand ? 0 : formatPoint(currentReward * JACKPOT_SAVE_RATE);
            const netBaseReward = formatPoint(currentReward - fee);
            const finalReward = formatPoint(netBaseReward + jackpotPayout);
            const updatedJackpot = formatPoint(jackpot + fee);

            if (jackpotUsedValue) {
                playGameSound("jackpot");
            } else if (finalReward > 0) {
                playGameSound("win");
            }

            const isWin = finalReward > 0;

            const updatedUser = {
                ...user,
                coin: formatPoint(Number(user.coin ?? 0) + finalReward),
                jackpot: Number(updatedJackpot ?? 0),
                win: isWin ? Number(user.win ?? 0) + 1 : Number(user.win ?? 0),
                lose_count: isWin ? Number(user.lose_count ?? 0) : Number(user.lose_count ?? 0) + 1
            };

            const saved = await saveUserData(updatedUser);

            if (!saved) {
                resetRewardProcessing();
                return;
            }

            const nextResultDetail = {
                handName: lastHandName,
                bet: Number(bet),
                baseReward: baseReward,
                jackpotFee: fee,
                finalReward: finalReward,
                usedMiniGame: usedMiniGame,
                miniResult: usedMiniGame ? "success" : "none",
                jackpotUsed: jackpotUsedValue,
                jackpotBonus: jackpotBonus,
                miniWinStreak: miniWinStreak
            };

            setJackpot(updatedJackpot);
            setCurrentReward(finalReward);
            setResultDetail(nextResultDetail);

            if (jackpotUsedValue) {
                setResult(
                    `${lastHandName}! 기본 보상 ${netBaseReward}P + 잭팟 ${jackpotBonus}P x${jackpotMultiplier} = ${jackpotPayout}P / 잭팟 판 추가 적립 없음 / 실제 획득 ${finalReward}P를 받았습니다.`
                );
            } else if (usedMiniGame) {
                setResult(
                    `${lastHandName}! 미니게임 ${miniWinStreak}연승 기본 보상에서 ${fee}P를 잭팟으로 적립하고 ${finalReward}P를 받았습니다.`
                );
            } else {
                setResult(
                    `${lastHandName}! 잭팟 적립 ${fee}P / 실제 획득 ${finalReward}P를 받았습니다.`
                );
            }

            setMiniRewardOrigin(0);
            setMiniWinStreak(0);
            setJackpotBonus(0);

            // 중요: 결과 화면을 먼저 띄워서 버튼을 사라지게 함
            setPhase("result");

            void saveGameLog({
                handNameValue: lastHandName,
                baseRewardValue: baseReward,
                jackpotFeeValue: fee,
                finalReward: finalReward,
                usedMiniGameValue: usedMiniGame,
                miniResult: usedMiniGame ? `success_${miniWinStreak}` : "none",
                jackpotUsedValue: jackpotUsedValue,
                finalCardsValue: hand
            });
        } catch (error) {
            console.error("보상 수령 처리 실패:", error);
            setResult("보상 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
            resetRewardProcessing();
        }
    };

    const startMiniGame = () => {
        if (rewardProcessingRef.current) return;
        if (!["miniChoice", "miniSuccess"].includes(phase)) return;

        playGameSound("click");

        const { leftCard, rightCard } = drawMiniGamePair();

        setMiniLeftCard(leftCard);
        setMiniRightCard(rightCard);
        setMiniLeftRevealed(false);
        setMiniSelectedGuess("");
        setUsedMiniGame(true);
        setMiniMessage("왼쪽 카드가 오른쪽 카드보다 높을까요? 낮을까요?");
        setPhase("miniGame");
    };

    const guessMiniGame = (guess) => {
        playGameSound("flip");

        if (!miniLeftCard || !miniRightCard) return;
        if (phase !== "miniGame") return;

        setMiniSelectedGuess(guess);
        setMiniLeftRevealed(true);
        setMiniMessage("왼쪽 카드를 공개합니다...");
        setPhase("miniRevealing");

        addTimer(() => {
            const isLeftHigher = miniLeftCard.value > miniRightCard.value;

            const isCorrect =
                (guess === "higher" && isLeftHigher) ||
                (guess === "lower" && !isLeftHigher);

            if (isCorrect) {
                playGameSound("win");

                const nextStreak = miniWinStreak + 1;
                const streakMultiplier = Math.pow(2, nextStreak);
                const originReward = Number(miniRewardOrigin || currentReward);
                const streakReward = formatPoint(originReward * streakMultiplier);

                setMiniWinStreak(nextStreak);
                setCurrentReward(streakReward);
                setMiniMessage(
                    `성공! ${nextStreak}연승으로 x${streakMultiplier} 배율이 적용되어 현재 획득 예정 금액이 ${streakReward}포인트가 되었습니다.`
                );
                setPhase("miniSuccess");
            } else {
                playGameSound("fail");

                const isJackpotHand = handPower[lastHandName] >= handPower["풀하우스"];
                const jackpotPayout = isJackpotHand
                    ? formatPoint(Number(jackpotBonus) * miniWinStreak)
                    : 0;

                setCurrentReward(0);

                if (isJackpotHand && miniWinStreak > 0) {
                    setMiniMessage(
                        `실패! 기본 배당은 잃었지만, ${miniWinStreak}연승까지 인정되어 잭팟 ${jackpotBonus}P x${miniWinStreak} = ${jackpotPayout}P를 받을 수 있습니다.`
                    );
                } else {
                    setMiniMessage("실패! 미니게임 보상을 모두 잃었습니다.");
                }

                setPhase("miniFail");
            }
        }, 750);
    };

    const continueMiniGame = () => {
        startMiniGame();
    };

    const finishAfterFail = async () => {
        if (phase !== "miniFail") return;

        if (rewardProcessingRef.current) return;

        rewardProcessingRef.current = true;
        setIsRewardProcessing(true);

        const isJackpotHand = handPower[lastHandName] >= handPower["풀하우스"];

        const jackpotMultiplier = isJackpotHand ? miniWinStreak : 0;
        const jackpotPayout = isJackpotHand
            ? formatPoint(Number(jackpotBonus) * jackpotMultiplier)
            : 0;

        const finalReward = jackpotPayout;
        const jackpotUsedValue = isJackpotHand && jackpotPayout > 0;
        const isWin = finalReward > 0;

        const updatedUser = {
            ...user,
            coin: formatPoint(Number(user.coin ?? 0) + finalReward),
            jackpot: Number(jackpot ?? 0),
            win: isWin ? Number(user.win ?? 0) + 1 : Number(user.win ?? 0),
            lose_count: isWin ? Number(user.lose_count ?? 0) : Number(user.lose_count ?? 0) + 1
        };

        const saved = await saveUserData(updatedUser);

        if (!saved) {
            resetRewardProcessing();
            return;
        }

        setResultDetail({
            handName: lastHandName,
            bet: Number(bet),
            baseReward: baseReward,
            jackpotFee: 0,
            finalReward: finalReward,
            usedMiniGame: true,
            miniResult: "fail",
            jackpotUsed: jackpotUsedValue,
            jackpotBonus: jackpotBonus,
            miniWinStreak: miniWinStreak
        });

        if (jackpotUsedValue) {
            setResult(
                `미니게임 실패! 기본 배당은 0P입니다. 하지만 잭팟은 ${miniWinStreak}연승까지 인정되어 ${jackpotBonus}P x${miniWinStreak} = ${finalReward}P를 받았습니다.`
            );
        } else {
            setResult("미니게임 실패로 획득 금액은 0P입니다.");
        }

        setCurrentReward(finalReward);
        setMiniRewardOrigin(0);
        setMiniWinStreak(0);
        setJackpotBonus(0);

        setPhase("result");

        void saveGameLog({
            handNameValue: lastHandName,
            baseRewardValue: baseReward,
            jackpotFeeValue: 0,
            finalReward: finalReward,
            usedMiniGameValue: true,
            miniResult: `fail_after_${miniWinStreak}`,
            jackpotUsedValue: jackpotUsedValue,
            finalCardsValue: hand
        });
    };

    const isGamePopupOpen = [
        "miniChoice",
        "miniGame",
        "miniRevealing",
        "miniSuccess",
        "miniFail",
        "result"
    ].includes(phase);

    const renderGamePopupContent = () => {
        if (phase === "miniChoice") {
            return (
                <>
                    <div className="game-popup-header mini">
                        <span className="game-popup-badge">MINI GAME</span>
                        <h2>미니게임 도전</h2>
                        <p>{result}</p>
                    </div>

                    <div className="game-popup-body compact">
                        <div className="popup-info-list">
                            <p>성공할 때마다 기본 배당은 계속 2배가 되고, 잭팟 판은 성공한 연승 수만큼 잭팟 배율이 올라갑니다.</p>
                            <p>실패하면 기본 보상은 <strong>0P</strong>가 됩니다. 잭팟 판도 0연승 실패면 잭팟은 0P입니다.</p>
                        </div>
                    </div>

                    <div className="game-popup-actions two-buttons">
                        <button
                            className="result-main-button"
                            onClick={startMiniGame}
                            disabled={isRewardProcessing}
                        >
                            도전하기
                        </button>
                        <button
                            className="result-sub-button"
                            onClick={takeReward}
                            disabled={isRewardProcessing}
                        >
                            {isRewardProcessing ? "처리 중..." : "그만하고 받기"}
                        </button>
                    </div>
                </>
            );
        }

        if (phase === "miniGame" || phase === "miniRevealing") {
            return (
                <>
                    <div className="game-popup-header mini">
                        <span className="game-popup-badge">HIGH & LOW</span>
                        <h2>High & Low 미니게임</h2>
                        <p>{miniMessage}</p>
                    </div>

                    <div className="game-popup-body">
                        <div className="mini-card-area popup-mini-card-area">
                            <div className="mini-card-wrap">
                                <p className="mini-card-label">LEFT</p>
                                {renderMiniCard(
                                    miniLeftCard,
                                    miniLeftRevealed,
                                    miniLeftRevealed ? "mini-left-open" : ""
                                )}
                            </div>

                            <div className="mini-card-wrap">
                                <p className="mini-card-label">RIGHT</p>
                                {renderMiniCard(miniRightCard, true)}
                            </div>
                        </div>
                    </div>

                    <div className="game-popup-actions two-buttons">
                        {phase === "miniGame" ? (
                            <>
                                <button
                                    className={`mini-choice-button higher-button ${
                                        miniSelectedGuess === "higher" ? "selected" : ""
                                    }`}
                                    onClick={() => guessMiniGame("higher")}
                                    disabled={phase !== "miniGame"}
                                >
                                    높음
                                </button>

                                <button
                                    className={`mini-choice-button lower-button ${
                                        miniSelectedGuess === "lower" ? "selected" : ""
                                    }`}
                                    onClick={() => guessMiniGame("lower")}
                                    disabled={phase !== "miniGame"}
                                >
                                    낮음
                                </button>
                            </>
                        ) : (
                            <button className="result-main-button" disabled>판정 중...</button>
                        )}
                    </div>
                </>
            );
        }

        if (phase === "miniSuccess") {
            return (
                <>
                    <div className="game-popup-header win">
                        <span className="game-popup-badge">SUCCESS</span>
                        <h2>미니게임 성공!</h2>
                        <p>{miniMessage}</p>
                    </div>

                    <div className="game-popup-body">
                        <div className="mini-card-area popup-mini-card-area">
                            <div className="mini-card-wrap">
                                <p className="mini-card-label">LEFT</p>
                                {renderMiniCard(miniLeftCard, true, "mini-left-open")}
                            </div>

                            <div className="mini-card-wrap">
                                <p className="mini-card-label">RIGHT</p>
                                {renderMiniCard(miniRightCard, true)}
                            </div>
                        </div>

                        <div className="popup-current-reward">
                            <span>현재 획득 예정</span>
                            <strong>{formatPoint(currentReward)}P</strong>
                        </div>
                    </div>

                    <div className="game-popup-actions two-buttons">
                        <button
                            className="result-main-button"
                            onClick={continueMiniGame}
                            disabled={isRewardProcessing}
                        >
                            계속 도전
                        </button>
                        <button
                            className="result-sub-button"
                            onClick={takeReward}
                            disabled={isRewardProcessing}
                        >
                            {isRewardProcessing ? "처리 중..." : "그만하고 받기"}
                        </button>
                    </div>
                </>
            );
        }

        if (phase === "miniFail") {
            return (
                <>
                    <div className="game-popup-header lose">
                        <span className="game-popup-badge">FAIL</span>
                        <h2>미니게임 실패</h2>
                        <p>{miniMessage}</p>
                    </div>

                    <div className="game-popup-body">
                        <div className="mini-card-area popup-mini-card-area">
                            <div className="mini-card-wrap">
                                <p className="mini-card-label">LEFT</p>
                                {renderMiniCard(miniLeftCard, true, "mini-left-open")}
                            </div>

                            <div className="mini-card-wrap">
                                <p className="mini-card-label">RIGHT</p>
                                {renderMiniCard(miniRightCard, true)}
                            </div>
                        </div>
                    </div>

                    <div className="game-popup-actions one-button">
                        <button
                            className="result-main-button"
                            onClick={finishAfterFail}
                            disabled={isRewardProcessing}
                        >
                            {isRewardProcessing ? "처리 중..." : "결과 확인"}
                        </button>
                    </div>
                </>
            );
        }

        if (phase === "result") {
            const isWin = Number(resultDetail?.finalReward ?? 0) > 0;

            if (!resultDetail) {
                return (
                    <>
                        <div className="game-popup-header lose">
                            <span className="game-popup-badge">RESULT</span>
                            <h2>게임 결과</h2>
                            <p>{result}</p>
                        </div>

                        <div className="game-popup-actions one-button">
                            <button className="result-main-button" onClick={startGame}>다시 하기</button>
                        </div>
                    </>
                );
            }

            return (
                <>
                    <div
                        className={`game-popup-header ${isWin ? "win" : "lose"} ${
                            resultDetail.jackpotUsed ? "jackpot" : ""
                        }`}
                    >
                        <span className="game-popup-badge">{isWin ? "WIN" : "LOSE"}</span>
                        <h2>{isWin ? "승리!" : "패배"}</h2>
                        <p>족보: <strong>{resultDetail.handName}</strong></p>
                    </div>

                    <div className="game-popup-body">
                        <div className={`popup-result-card ${isWin ? "win" : "lose"}`}>
                            <span>최종 획득</span>
                            <strong>{formatPoint(resultDetail.finalReward)}P</strong>
                        </div>

                        <div className="popup-result-grid">
                            <div>
                                <span>배팅</span>
                                <strong>{formatPoint(resultDetail.bet)}P</strong>
                            </div>

                            <div>
                                <span>기본 배당</span>
                                <strong>{formatPoint(resultDetail.baseReward)}P</strong>
                            </div>

                            <div>
                                <span>잭팟 적립</span>
                                <strong>{formatPoint(resultDetail.jackpotFee)}P</strong>
                            </div>

                            <div>
                                <span>미니게임</span>
                                <strong>
                                    {resultDetail.miniResult === "success" && "성공"}
                                    {resultDetail.miniResult === "fail" && "실패"}
                                    {resultDetail.miniResult === "none" && "안 함"}
                                </strong>
                            </div>

                            <div>
                                <span>잭팟</span>
                                <strong>{resultDetail.jackpotUsed ? "사용" : "-"}</strong>
                            </div>

                            <div>
                                <span>결과</span>
                                <strong>{isWin ? "코인 획득" : "획득 없음"}</strong>
                            </div>
                        </div>

                        <p className="popup-result-summary">{result}</p>
                    </div>

                    <div className="game-popup-actions two-buttons">
                        <button className="result-main-button" onClick={startGame}>다시 하기</button>
                        <button className="result-sub-button" onClick={() => setPhase("ready")}>닫기</button>
                    </div>
                </>
            );
        }

        return null;
    };

    return (
        <div
            className={`game-page theme-${uiTheme} card-design-${cardDesign} ${
                isJokerGuaranteedRound
                    ? "joker-guaranteed-mode"
                    : isJokerBoostRound
                        ? "joker-boost-mode"
                        : ""
            }`}
        >
            <header className="casino-topbar">
                <div className="casino-brand">
                    <div className="casino-logo">♠</div>

                    <div>
                        <h1>Five Draw Poker</h1>
                        <p>Joker Casino Table</p>
                    </div>
                </div>

                <div className="casino-status-area">
                    <div className="casino-status-chip">
                        <span>COIN</span>
                        <strong>{formatPoint(user.coin)}P</strong>
                    </div>

                    <div className="casino-status-chip jackpot">
                        <span>JACKPOT</span>
                        <strong>{formatPoint(jackpot)}P</strong>
                    </div>

                    <div className="casino-status-chip">
                        <span>ROUND</span>
                        <strong>{currentRoundNumber}판</strong>
                    </div>

                    <div
                        className={`casino-status-chip joker ${
                            isJokerGuaranteedRound
                                ? "guaranteed"
                                : isJokerBoostRound
                                    ? "boost"
                                    : ""
                        }`}
                    >
                        <span>JOKER</span>
                        <strong>{(currentJokerRate * 100).toFixed(0)}%</strong>
                    </div>
                </div>

                <div className="casino-menu">
                    <button onClick={() => setShowRuleModal(true)}>
                        게임 방법
                    </button>

                    <button onClick={() => setShowMissionModal(true)}>
                        미션
                    </button>

                    <button
                        onClick={() => {
                            localStorage.setItem("pokerPage", "mypage");
                            setPage("mypage");
                        }}
                    >
                        마이페이지
                    </button>

                    <button onClick={() => setShowSettingsModal(true)}>
                        설정
                    </button>

                    <button className="casino-logout-button" onClick={handleLogout}>
                        로그아웃
                    </button>
                </div>
            </header>

            {currentJokerRule !== "normal" && (
                <div
                    className={`joker-round-banner ${
                        isJokerGuaranteedRound ? "guaranteed" : "boost"
                    }`}
                >
                    <div className="joker-round-icon">🃏</div>

                    <div className="joker-round-text">
                        <strong>{jokerRoundTitle}</strong>
                        <p>{jokerRoundMessage}</p>
                    </div>

                    <div className="joker-round-rate">
                        {(currentJokerRate * 100).toFixed(0)}%
                    </div>
                </div>
            )}

            <div className="game-layout">
                <section className="game-main-panel">
                    <div className="table-top">
                        <h2>카드 테이블</h2>
                        <p className="phase-text">
                            {phase === "ready" && "베팅 금액을 정하고 게임을 시작하세요."}
                            {phase === "dealing" && "카드를 배분하는 중입니다..."}
                            {phase === "draw" && "유지할 카드를 HOLD 하세요. HOLD 하지 않은 카드가 교환됩니다."}
                            {phase === "exchanging" && "HOLD 하지 않은 카드를 교환하는 중입니다..."}
                            {phase === "miniChoice" && "투페어 이상입니다. 미니게임에 도전할 수 있습니다."}
                            {phase === "miniGame" && "왼쪽 카드가 오른쪽 카드보다 높은지 낮은지 맞히세요."}
                            {phase === "miniRevealing" && "왼쪽 카드를 공개하는 중입니다..."}
                            {phase === "miniSuccess" && "성공했습니다. 계속 도전하거나 보상을 받을 수 있습니다."}
                            {phase === "miniFail" && "실패했습니다. 결과를 확인하세요."}
                            {phase === "result" && "게임 결과를 확인하세요."}
                        </p>
                    </div>

                    <div className="card-area">
                        {hand.length === 0 ? (
                            <div className="empty-card-message">
                                아직 받은 카드가 없습니다.
                            </div>
                        ) : (
                            hand.map((card, index) => {
                                const isDealt = index < dealtCount;
                                const isRevealed = revealedCards.includes(index);

                                if (!isDealt) {
                                    return (
                                        <div key={index} className="card card-placeholder"></div>
                                    );
                                }

                                return (
                                    <div
                                        key={index}
                                        className={`card 
                                        ${heldCards.includes(index) ? "held-card" : ""} 
                                        ${winningCards.includes(index) && isRevealed ? "winning-card" : ""}
                                        ${exchangingCards.includes(index) ? "card-exchange-out" : ""} 
                                        ${incomingCards.includes(index) && !isRevealed ? "card-incoming" : ""} 
                                        ${card.isJoker && isRevealed ? "joker-card" : ""} 
                                        ${(card.suit === "♥" || card.suit === "♦") && isRevealed ? "red-card" : ""} 
                                        ${(card.suit === "♠" || card.suit === "♣") && isRevealed ? "black-card" : ""} 
                                        ${!isRevealed ? "card-hidden" : "card-reveal"}
                                    `}
                                        style={{
                                            "--card-index": index,
                                            "--exchange-order": Math.max(exchangingCards.indexOf(index), 0),
                                            "--incoming-order": Math.max(incomingCards.indexOf(index), 0)
                                        }}
                                        onClick={() => toggleHoldCard(index)}
                                    >
                                        {!isRevealed ? (
                                            <div className="card-back-design"></div>
                                        ) : (
                                            <>
                                                {heldCards.includes(index) && (
                                                    <div className="hold-badge">HOLD</div>
                                                )}

                                                {card.isJoker ? (
                                                    <div className="joker-face">
                                                        <div className="joker-top">JOKER</div>
                                                        <div className="joker-center">🃏</div>
                                                        <div className="joker-bottom">JOKER</div>
                                                    </div>
                                                ) : (
                                                    <div className="card-face">
                                                        <div className="card-corner corner-top-left">
                                                            <span className="corner-rank">{card.rank}</span>
                                                            <span className="corner-suit">{card.suit}</span>
                                                        </div>

                                                        {renderCardCenter(card.rank, card.suit)}


                                                        <div className="card-corner corner-bottom-right">
                                                            <span className="corner-rank">{card.rank}</span>
                                                            <span className="corner-suit">{card.suit}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="action-area">
                        {phase === "ready" && (
                            <button
                                onClick={startGame}
                                className={`start-game-button ${
                                    isJokerGuaranteedRound
                                        ? "start-game-guaranteed"
                                        : isJokerBoostRound
                                            ? "start-game-boost"
                                            : ""
                                }`}
                            >
                                {isJokerGuaranteedRound
                                    ? "조커 확정 라운드 시작"
                                    : isJokerBoostRound
                                        ? "조커 찬스 라운드 시작"
                                        : "게임 시작"}
                            </button>
                        )}

                        {phase === "draw" && (
                            <>
                                <p className="message">HOLD 표시된 카드는 유지되고, 나머지 카드가 교환됩니다.</p>
                                <button
                                    onClick={exchangeCards}
                                    disabled={phase !== "draw"}
                                >
                                    HOLD 안 한 카드 교환
                                </button>
                            </>
                        )}

                        {phase === "exchanging" && (
                            <>
                                <p className="message">카드를 교환하는 중입니다...</p>
                                <button disabled>교환 중...</button>
                            </>
                        )}

                    </div>
                </section>

                <aside className="game-side-panel control-panel">
                    <div className="control-panel-header">
                        <h2>Game Control</h2>
                        <p>배팅과 라운드 정보를 확인하세요.</p>
                    </div>

                    <div className="side-card bet-control-card">
                        <h3>배팅</h3>

                        <div className="bet-input-box">
                            <label>배팅 포인트</label>
                            <input
                                type="number"
                                value={bet}
                                onChange={(e) => {
                                    const value = e.target.value;

                                    // 입력 중에는 빈칸 허용
                                    if (value === "") {
                                        setBet("");
                                        return;
                                    }

                                    setBet(Number(value));
                                }}
                                onBlur={() => {
                                    const numericBet = Number(bet);

                                    if (!numericBet || numericBet < MIN_BET) {
                                        setBet(MIN_BET);
                                        return;
                                    }

                                    if (numericBet > Number(user.coin ?? 0)) {
                                        setBet(Number(user.coin ?? 0));
                                    }
                                }}
                                min={MIN_BET}
                                max={Number(user.coin ?? 0)}
                                disabled={phase !== "ready" && phase !== "result"}
                            />
                        </div>

                        <p className="bet-help-text">
                            최소 배팅: <strong>{MIN_BET}P</strong> / 보유 코인: <strong>{formatPoint(user.coin)}P</strong>
                        </p>

                        {phase !== "ready" && phase !== "result" && (
                            <p className="bet-locked-text">
                                게임 진행 중에는 배팅을 변경할 수 없습니다.
                            </p>
                        )}
                    </div>

                    <div className="side-card round-info-card">
                        <h3>라운드 정보</h3>

                        <div className="round-info-row">
                            <span>현재 판</span>
                            <strong>{currentRoundNumber}판</strong>
                        </div>

                        <div className="round-info-row">
                            <span>조커 확률</span>
                            <strong>{(currentJokerRate * 100).toFixed(1)}%</strong>
                        </div>

                        <div className="round-info-row">
                            <span>잭팟</span>
                            <strong>{formatPoint(jackpot)}P</strong>
                        </div>

                        {isJokerBoostRound && (
                            <div className="special-round-mini-badge boost">
                                🃏 조커 찬스 라운드
                            </div>
                        )}

                        {isJokerGuaranteedRound && (
                            <div className="special-round-mini-badge guaranteed">
                                🔥 조커 확정 라운드
                            </div>
                        )}
                    </div>

                    {Number(user.coin ?? 0) < 10 && (
                        <div className="side-card support-card">
                            <h3>오늘의 지원금</h3>
                            <p>코인이 부족합니다.</p>
                            <p>하루 1번 500P를 받을 수 있습니다.</p>

                            <button onClick={claimDailySupport}>
                                500P 받기
                            </button>

                            {supportMessage && (
                                <p className="support-message">{supportMessage}</p>
                            )}
                        </div>
                    )}

                    <div className="side-card payout-side-card">
                        <h3>배당표</h3>

                        <div className="payout-list compact-payout-list">
                            <p><span>원페어</span><strong>x0.5</strong></p>
                            <p><span>투페어</span><strong>x1</strong></p>
                            <p><span>트리플</span><strong>x2</strong></p>
                            <p><span>스트레이트</span><strong>x3</strong></p>
                            <p><span>플러시</span><strong>x5</strong></p>
                            <p><span>풀하우스</span><strong>x7</strong></p>
                            <p><span>포카드</span><strong>x15</strong></p>
                            <p><span>스트레이트 플러시</span><strong>x30</strong></p>
                            <p><span>로얄 스트레이트 플러시</span><strong>x50</strong></p>
                            <p><span>파이브 카드</span><strong>x100</strong></p>
                        </div>
                    </div>
                </aside>
            </div>

            {isGamePopupOpen && (
                <div className="game-popup-backdrop">
                    <div className="game-popup-panel" onClick={(e) => e.stopPropagation()}>
                        {renderGamePopupContent()}
                    </div>
                </div>
            )}

            {jokerOverlay && (
                <div className={`joker-overlay ${jokerOverlay.type}`}>
                    <div className="joker-overlay-card">
                        <div className="joker-overlay-icon">🃏</div>
                        <h1>{jokerOverlay.title}</h1>
                        <p>{jokerOverlay.message}</p>
                        <div className="joker-overlay-rate">{jokerOverlay.rate}</div>
                    </div>
                </div>
            )}

            {missionNotice && (
                <div className="mission-notice-toast">
                    <strong>{missionNotice.title}</strong>
                    <p>{missionNotice.text}</p>
                    <span>{missionNotice.subText}</span>
                </div>
            )}

            <GameRuleModal
                isOpen={showRuleModal}
                onClose={() => setShowRuleModal(false)}
            />

            <SettingsModal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
                soundEnabled={soundEnabled}
                setSoundEnabled={setSoundEnabled}
                soundVolume={soundVolume}
                setSoundVolume={setSoundVolume}
                uiTheme={uiTheme}
                setUiTheme={setUiTheme}
                cardDesign={cardDesign}
                setCardDesign={setCardDesign}
            />

            <MissionModal
                isOpen={showMissionModal}
                onClose={() => setShowMissionModal(false)}
                user={user}
                setUser={setUser}
            />
        </div>
    );
}

function SettingsModal({
                           isOpen,
                           onClose,
                           soundEnabled,
                           setSoundEnabled,
                           soundVolume,
                           setSoundVolume,
                           uiTheme,
                           setUiTheme,
                           cardDesign,
                           setCardDesign
                       }) {

    if (!isOpen) return null;

    return (
        <div className="settings-modal-backdrop" onClick={onClose}>
            <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                <div className="settings-modal-header">
                    <div>
                        <h2>설정</h2>
                        <p>게임 화면과 효과음을 설정할 수 있습니다.</p>
                    </div>

                    <button className="settings-close-button" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="settings-modal-content">
                    <section className="settings-section">
                        <h3>사운드</h3>

                        <div className="settings-row">
                            <div>
                                <strong>효과음</strong>
                                <p>카드 배분, 승리, 실패 효과음을 켜거나 끕니다.</p>
                            </div>

                            <button
                                className={`settings-toggle-button ${
                                    soundEnabled ? "active" : ""
                                }`}
                                onClick={() => setSoundEnabled(prev => !prev)}
                            >
                                {soundEnabled ? "ON" : "OFF"}
                            </button>
                        </div>

                        <div className="settings-row">
                            <div>
                                <strong>효과음 음량</strong>
                                <p>게임 효과음의 크기를 조절합니다.</p>
                            </div>

                            <div className="volume-control">
                                <input
                                    className="volume-slider"
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={Math.round(soundVolume * 100)}
                                    onChange={(e) => setSoundVolume(Number(e.target.value) / 100)}
                                />
                                <span>{Math.round(soundVolume * 100)}%</span>
                            </div>
                        </div>

                    </section>

                    <section className="settings-section">
                        <h3>디자인</h3>

                        <div className="settings-row settings-row-column">
                            <div>
                                <strong>테마</strong>
                                <p>게임 화면의 전체 색상 분위기를 변경합니다.</p>
                            </div>

                            <div className="settings-option-group">
                                <button
                                    className={`settings-option-button ${uiTheme === "casino" ? "active" : ""}`}
                                    onClick={() => setUiTheme("casino")}
                                >
                                    카지노 그린
                                </button>

                                <button
                                    className={`settings-option-button ${uiTheme === "dark" ? "active" : ""}`}
                                    onClick={() => setUiTheme("dark")}
                                >
                                    다크
                                </button>

                                <button
                                    className={`settings-option-button ${uiTheme === "purple" ? "active" : ""}`}
                                    onClick={() => setUiTheme("purple")}
                                >
                                    로얄 퍼플
                                </button>
                            </div>
                        </div>

                        <div className="settings-row settings-row-column">
                            <div>
                                <strong>카드 디자인</strong>
                                <p>카드 앞면과 뒷면의 디자인을 변경합니다.</p>
                            </div>

                            <div className="settings-option-group">
                                <button
                                    className={`settings-option-button ${cardDesign === "classic" ? "active" : ""}`}
                                    onClick={() => setCardDesign("classic")}
                                >
                                    Classic
                                </button>

                                <button
                                    className={`settings-option-button ${cardDesign === "modern" ? "active" : ""}`}
                                    onClick={() => setCardDesign("modern")}
                                >
                                    Modern
                                </button>

                                <button
                                    className={`settings-option-button ${cardDesign === "luxury" ? "active" : ""}`}
                                    onClick={() => setCardDesign("luxury")}
                                >
                                    Luxury
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default Game;