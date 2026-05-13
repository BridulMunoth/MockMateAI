"use client";

export default function CompanyLogo({ name, fallback }: { name: string, fallback: string }) {
   return (
      <img 
        src={`https://cdn.simpleicons.org/${name.toLowerCase().replace(/\s+/g, '')}`} 
        alt={name}
        className="w-8 h-8 object-contain"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.parentElement!.innerHTML = `<span class="text-white">${fallback}</span>`;
        }}
      />
   );
}
