const colorMap = {
  BAIXA: ['#1D8348', '#D5F5E3'],
  MEDIA: ['#AF601A', '#FDEBD0'],
  ALTA: ['#B03A2E', '#FADBD8'],
  CRITICA: ['#641E16', '#F5B7B1'],
};

export function createPopPlaceholder(title, criticality = 'MEDIA') {
  const [accent, soft] = colorMap[criticality] ?? colorMap.MEDIA;
  const safeTitle = (title?.slice(0, 32) ?? 'POP').replace(/&/g, 'e');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${accent}" />
          <stop offset="100%" stop-color="${soft}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="720" fill="url(#bg)" rx="32" />
      <rect x="70" y="70" width="1060" height="580" rx="24" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.45)" />
      <text x="86" y="165" fill="#ffffff" font-size="30" font-family="Verdana, sans-serif" opacity="0.9">Manual POP Operacional</text>
      <text x="86" y="275" fill="#ffffff" font-size="68" font-weight="700" font-family="Verdana, sans-serif">${safeTitle}</text>
      <text x="86" y="362" fill="#ffffff" font-size="32" font-family="Verdana, sans-serif">Consulta rapida para operacao ferroviaria</text>
      <circle cx="980" cy="182" r="92" fill="rgba(255,255,255,0.14)" />
      <circle cx="1050" cy="520" r="124" fill="rgba(255,255,255,0.14)" />
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
