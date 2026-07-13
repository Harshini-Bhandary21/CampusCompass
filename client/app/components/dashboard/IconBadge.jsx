// Shared accent treatment (blur glow behind a primary/10 box) so every
// dashboard page reuses the same visual signature as Sidebar's logo badge
// and active-tab icons instead of inventing a one-off look per page.
export default function IconBadge({ icon: Icon, size = "md" }) {
  const box = size === "lg" ? "w-16 h-16" : "w-10 h-10";
  const iconSize = size === "lg" ? "h-8 w-8" : "h-5 w-5";

  return (
    <div className="relative inline-flex shrink-0">
      <div className="absolute inset-0 bg-primary/20 blur-md rounded-xl" />
      <div
        className={`relative ${box} rounded-xl bg-primary/10 flex items-center justify-center`}
      >
        <Icon className={`${iconSize} text-primary`} />
      </div>
    </div>
  );
}
