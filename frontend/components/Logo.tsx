import Link from "next/link";

interface LogoProps {
  className?: string;
  height?: number;
  showText?: boolean;
  href?: string;
  textSize?: "sm" | "md" | "lg" | "xl";
}

const textSizeClasses = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl",
};

export default function Logo({
  className = "",
  height = 40,
  showText = true,
  href,
  textSize = "lg",
}: LogoProps) {
  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Image */}
      <img
        src="/synqer.png"
        alt="Synqer Logo"
        style={{ height: `${height}px`, width: "auto" }}
        className="object-contain flex-shrink-0"
      />
      {/* Logo Text with Gradient */}
      {showText && (
        <span
          className={`${textSizeClasses[textSize]} font-bold bg-clip-text text-transparent`}
          style={{
            backgroundImage:
              "linear-gradient(to right, #6780c7, #78b0e0)",
          }}
        >
          Synqer
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="hover:opacity-80 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}

