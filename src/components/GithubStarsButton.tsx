import { useEffect, useState } from "react";
import { SITE } from "@/config";
interface GitHubStarsButtonProps {
    variant?: "default" | "outline" | "ghost";
    size?: "sm" | "default" | "lg";
    className?: string;
}

export default function GitHubStarsButton({
    variant = "default",
    size = "default",
    className = "",
}: GitHubStarsButtonProps) {
    const [stars, setStars] = useState<number | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showParticles, setShowParticles] = useState(false);

    useEffect(() => {
        const fetchStars = async () => {
            try {
                const response = await fetch(`https://api.github.com/repos/${SITE.authorUsername}/TimeCapsule`);
                if (response.ok) {
                    const data = await response.json();
                    setStars(data.stargazers_count);
                }
            } catch (error) {
                console.error("Failed to fetch stars:", error);
            }
        };
        fetchStars();
    }, []);

    const formatStars = (count: number) => {
        if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}k`;
        }
        return count.toString();
    };

    const handleClick = () => {
        setIsAnimating(true);
        setShowParticles(true);
        setTimeout(() => setIsAnimating(false), 600);
        setTimeout(() => setShowParticles(false), 1000);
    };

    // Variant styles
    const variants = {
        default: "bg-foreground text-background hover:bg-foreground/90",
        outline: "bg-background text-foreground border border-border hover:bg-muted",
        ghost: "bg-transparent text-foreground hover:bg-muted",
    };

    // Size styles
    const sizes = {
        sm: "h-8 px-3 text-xs gap-1.5",
        default: "h-9 px-4 text-sm gap-2",
        lg: "h-10 px-6 text-base gap-2.5",
    };

    return (
        <a
            href={SITE.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className={`
                relative inline-flex items-center justify-center
                rounded-lg font-medium
                transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                disabled:pointer-events-none disabled:opacity-50
                overflow-hidden
                ${variants[variant]}
                ${sizes[size]}
                ${className}
            `}
        >
            {/* GitHub Logo SVG */}
            <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
            >
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>

            {/* Star Count */}
            {stars !== null ? (
                <span className="font-semibold tabular-nums">
                    {formatStars(stars)}
                </span>
            ) : (
                <span className="w-8 h-4 bg-current/20 rounded animate-pulse" />
            )}

            {/* Star Icon with Animation */}
            <svg
                className={`w-4 h-4 transition-all text-yellow-800 duration-300 ${isAnimating ? "scale-125 rotate-12" : "scale-100 rotate-0"
                    }`}
                fill={isAnimating ? "#fbbf24" : "#fbbf24"}
                stroke={isAnimating ? "#fbbf24" : "#fbbf24"}
                viewBox="0 0 24 24"
            >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>

            {/* Particle Effects */}
            {showParticles && (
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute top-1/2 left-1/2 w-1 h-1 bg-yellow-400 rounded-full animate-particle"
                            style={{
                                animationDelay: `${i * 50}ms`,
                                transform: `rotate(${i * 60}deg)`,
                            }}
                        />
                    ))}
                </div>
            )}
        </a>
    );
}