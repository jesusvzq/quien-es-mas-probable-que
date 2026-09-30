"use client";

export function DevCredit() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-1 z-10 text-center text-[10px] text-foreground/35">
      Desarrollado por{" "}
      <a
        href="https://www.linkedin.com/in/jesusvazqueznavarro/"
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto underline underline-offset-2"
      >
        Jesús Vázquez
      </a>
    </div>
  );
}
