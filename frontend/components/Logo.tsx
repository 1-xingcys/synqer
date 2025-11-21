interface LogoProps {
  className?: string;
  height?: number;
}

export default function Logo({ 
  className = "", 
  height = 60
}: LogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <img
        src="/synqer.png"
        alt="Synqer Logo"
        style={{ height: `${height}px`, width: "auto" }}
        className="object-contain"
      />
    </div>
  );
}

