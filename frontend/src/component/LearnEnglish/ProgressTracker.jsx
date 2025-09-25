import React from 'react';
import styles from './styles.module.css';

const ProgressTracker = ({ userProgress, sessionResult, onClose }) => {
    if (!sessionResult) return null;

    const { sessionStats, userProgress: updatedProgress } = sessionResult;

    const getScoreColor = (score) => {
        if (score >= 80) return '#51cf66';
        if (score >= 60) return '#ffd43b';
        return '#ff6b6b';
    };

    const getPerformanceLevel = (score) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        return 'Needs Improvement';
    };

    const renderSkillProgress = (skill, current, previous = 0) => {
        const improvement = current - previous;
        const isImprovement = improvement > 0;

        return (
            <div className={styles.skill_progress}>
                <div className={styles.skill_header}>
                    <span className={styles.skill_name}>{skill}</span>
                    <span className={styles.skill_score}>{Math.round(current)}/100</span>
                </div>
                <div className={styles.progress_bar}>
                    <div 
                        className={styles.progress_fill}
                        style={{ 
                            width: `${current}%`,
                            backgroundColor: getScoreColor(current)
                        }}
                    ></div>
                </div>
                {improvement !== 0 && (
                    <div className={`${styles.improvement} ${isImprovement ? styles.positive : styles.negative}`}>
                        {isImprovement ? '↗️' : '↘️'} {Math.abs(improvement).toFixed(1)} points
                    </div>
                )}
            </div>
        );
    };

    const renderAchievements = () => {
        const achievements = [];

        // Check for new achievements based on session performance
        if (sessionStats.overallScore >= 90) {
            achievements.push({
                name: 'Perfect Performance',
                description: 'Scored 90+ in a session',
                icon: '🏆'
            });
        }

        if (sessionStats.messagesCount >= 10) {
            achievements.push({
                name: 'Conversationalist',
                description: 'Exchanged 10+ messages in a session',
                icon: '💬'
            });
        }

        if (sessionStats.pronunciationAverage >= 85) {
            achievements.push({
                name: 'Clear Speaker',
                description: 'Excellent pronunciation score',
                icon: '🗣️'
            });
        }

        if (sessionStats.grammarAverage >= 85) {
            achievements.push({
                name: 'Grammar Master',
                description: 'Excellent grammar score',
                icon: '📝'
            });
        }

        if (updatedProgress.completedSessions >= 5) {
            achievements.push({
                name: 'Dedicated Learner',
                description: 'Completed 5+ learning sessions',
                icon: '📚'
            });
        }

        return achievements;
    };

    const achievements = renderAchievements();

    return (
        <div className={styles.progress_overlay}>
            <div className={styles.progress_modal}>
                <div className={styles.progress_header}>
                    <h2>🎉 Session Complete!</h2>
                    <button className={styles.close_btn} onClick={onClose}>×</button>
                </div>

                <div className={styles.progress_content}>
                    {/* Session Summary */}
                    <div className={styles.session_summary}>
                        <div className={styles.summary_card}>
                            <div className={styles.overall_score_large}>
                                <div 
                                    className={styles.score_circle_large}
                                    style={{ borderColor: getScoreColor(sessionStats.overallScore) }}
                                >
                                    <span className={styles.score_number_large}>{sessionStats.overallScore}</span>
                                    <span className={styles.score_label_large}>Overall Score</span>
                                </div>
                                <p className={styles.performance_level}>
                                    {getPerformanceLevel(sessionStats.overallScore)}
                                </p>
                            </div>

                            <div className={styles.session_details}>
                                <div className={styles.detail_item}>
                                    <span className={styles.detail_icon}>⏱️</span>
                                    <span className={styles.detail_label}>Duration:</span>
                                    <span className={styles.detail_value}>{sessionStats.duration} min</span>
                                </div>
                                <div className={styles.detail_item}>
                                    <span className={styles.detail_icon}>💬</span>
                                    <span className={styles.detail_label}>Messages:</span>
                                    <span className={styles.detail_value}>{sessionStats.messagesCount}</span>
                                </div>
                                <div className={styles.detail_item}>
                                    <span className={styles.detail_icon}>📚</span>
                                    <span className={styles.detail_label}>New Words:</span>
                                    <span className={styles.detail_value}>{sessionStats.vocabularyWordsLearned}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Skills Breakdown */}
                    <div className={styles.skills_section}>
                        <h3>📊 Skills Breakdown</h3>
                        <div className={styles.skills_grid}>
                            {renderSkillProgress(
                                'Pronunciation', 
                                sessionStats.pronunciationAverage,
                                updatedProgress.skillsProgress.pronunciation.currentScore
                            )}
                            {renderSkillProgress(
                                'Grammar', 
                                sessionStats.grammarAverage,
                                updatedProgress.skillsProgress.grammar.currentScore
                            )}
                            <div className={styles.vocabulary_stats}>
                                <div className={styles.vocab_header}>
                                    <span className={styles.skill_name}>Vocabulary</span>
                                    <span className={styles.vocab_level}>
                                        {updatedProgress.skillsProgress.vocabulary.currentLevel}
                                    </span>
                                </div>
                                <div className={styles.vocab_details}>
                                    <span>Total Words Learned: {updatedProgress.skillsProgress.vocabulary.wordsLearned}</span>
                                    <span>This Session: +{sessionStats.vocabularyWordsLearned}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Overall Progress */}
                    <div className={styles.overall_progress}>
                        <h3>🚀 Your Learning Journey</h3>
                        <div className={styles.progress_stats_grid}>
                            <div className={styles.progress_stat}>
                                <div className={styles.stat_number}>{updatedProgress.completedSessions}</div>
                                <div className={styles.stat_label}>Sessions Completed</div>
                            </div>
                            <div className={styles.progress_stat}>
                                <div className={styles.stat_number}>{Math.round(updatedProgress.totalStudyTime / 60 * 10) / 10}h</div>
                                <div className={styles.stat_label}>Total Study Time</div>
                            </div>
                            <div className={styles.progress_stat}>
                                <div className={styles.stat_number}>{updatedProgress.streakDays}</div>
                                <div className={styles.stat_label}>Day Streak</div>
                            </div>
                            <div className={styles.progress_stat}>
                                <div className={styles.stat_number}>{updatedProgress.skillsProgress.vocabulary.wordsLearned}</div>
                                <div className={styles.stat_label}>Words Learned</div>
                            </div>
                        </div>
                    </div>

                    {/* Achievements */}
                    {achievements.length > 0 && (
                        <div className={styles.achievements_section}>
                            <h3>🏆 New Achievements</h3>
                            <div className={styles.achievements_grid}>
                                {achievements.map((achievement, index) => (
                                    <div key={index} className={styles.achievement_card}>
                                        <div className={styles.achievement_icon}>{achievement.icon}</div>
                                        <div className={styles.achievement_info}>
                                            <h4>{achievement.name}</h4>
                                            <p>{achievement.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recommendations */}
                    <div className={styles.recommendations}>
                        <h3>💡 Recommendations</h3>
                        <div className={styles.recommendation_list}>
                            {sessionStats.pronunciationAverage < 70 && (
                                <div className={styles.recommendation_item}>
                                    <span className={styles.rec_icon}>🗣️</span>
                                    <span>Practice pronunciation with tongue twisters and phonetic exercises</span>
                                </div>
                            )}
                            {sessionStats.grammarAverage < 70 && (
                                <div className={styles.recommendation_item}>
                                    <span className={styles.rec_icon}>📝</span>
                                    <span>Review grammar rules and practice with structured exercises</span>
                                </div>
                            )}
                            {sessionStats.vocabularyWordsLearned < 3 && (
                                <div className={styles.recommendation_item}>
                                    <span className={styles.rec_icon}>📚</span>
                                    <span>Try to use more varied vocabulary in your conversations</span>
                                </div>
                            )}
                            {sessionStats.messagesCount < 5 && (
                                <div className={styles.recommendation_item}>
                                    <span className={styles.rec_icon}>💬</span>
                                    <span>Engage in longer conversations to improve fluency</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.progress_footer}>
                    <button className={styles.continue_btn} onClick={onClose}>
                        Continue Learning
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProgressTracker;
