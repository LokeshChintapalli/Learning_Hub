import styles from "./styles.module.css";
import { Link } from 'react-router-dom';

const Main = () => {
    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.reload();
    }

    const modules = [
        {
            id: 1,
            title: "Virtual Assistant",
            description: "AI-powered assistant to help answer questions and provide intelligent support for various tasks.",
            icon: "🤖",
            path: "/virtual-assistant",
            color: "linear-gradient(135deg, #667eea, #764ba2)"
        },
        {
            id: 2,
            title: "Simple Document Summarizer",
            description: "Quick 5-point summaries powered by Gemini 1.5 Flash. Fast, simple, and effective document analysis.",
            icon: "⚡",
            path: "/simple-document-summarizer",
            color: "linear-gradient(135deg, #667eea, #764ba2)"
        },
        {
            id: 3,
            title: "Learn English",
            description: "Interactive English learning platform with personalized lessons and progress tracking.",
            icon: "📚",
            path: "/learn-english",
            color: "linear-gradient(135deg, #4facfe, #00f2fe)"
        }
    ];

    return (
        <div className={styles.main_container}>
            <nav className={styles.navbar}>
                <h1>Dashboard</h1>
                <button className={styles.white_btn} onClick={handleLogout}>
                    Logout
                </button>
            </nav>
            
            <div className={styles.main_content}>
                <div className={styles.welcome_section}>
                    <h2>Welcome to Your Learning Hub</h2>
                    <p>Explore our AI-powered modules designed to enhance your productivity and learning experience.</p>
                </div>

                <div className={styles.stats_section}>
                    <div className={styles.stat_card}>
                        <div className={styles.stat_number}>3</div>
                        <div className={styles.stat_label}>Available Modules</div>
                    </div>
                    <div className={styles.stat_card}>
                        <div className={styles.stat_number}>24/7</div>
                        <div className={styles.stat_label}>AI Support</div>
                    </div>
                    <div className={styles.stat_card}>
                        <div className={styles.stat_number}>∞</div>
                        <div className={styles.stat_label}>Learning Possibilities</div>
                    </div>
                    <div className={styles.stat_card}>
                        <div className={styles.stat_number}>100%</div>
                        <div className={styles.stat_label}>Personalized</div>
                    </div>
                </div>

                <div className={styles.modules_section}>
                    <h3>Choose Your Module</h3>
                    <div className={styles.dashboard_cards}>
                        {modules.map(module => (
                            <Link 
                                key={module.id} 
                                to={module.path} 
                                className={styles.module_link}
                            >
                                <div className={styles.dashboard_card}>
                                    <div 
                                        className={styles.card_icon}
                                        style={{ background: module.color }}
                                    >
                                        {module.icon}
                                    </div>
                                    <h3>{module.title}</h3>
                                    <p>{module.description}</p>
                                    <div className={styles.card_action}>
                                        <span className={styles.action_text}>Get Started</span>
                                        <span className={styles.action_arrow}>→</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

               
            </div>
        </div>
    );
};

export default Main;
