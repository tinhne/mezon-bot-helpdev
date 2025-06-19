export function extractMessage(message: string) {
  // Xử lý cả hai loại tiền tố * và /
  let prefix = '';
  let cleanMessage = message;
  
  // Kiểm tra và loại bỏ tiền tố
  if (message.startsWith('*')) {
    prefix = '*';
    cleanMessage = message.slice('*'.length);
  } else if (message.startsWith('/')) {
    prefix = '/';
    cleanMessage = message.slice('/'.length);
  } else {
    return [false, []]; // Không có tiền tố hợp lệ
  }
  
  // Xử lý các đối số
  const args = cleanMessage.replace('\n', ' ').trim().split(/ +/);
  
  if (args.length > 0) {
    return [args.shift()?.toLowerCase(), args];
  } else {
    return [false, []];
  }
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getRandomColor(): string {
  const colors: string[] = [
    '#1ABC9C', // Aqua
    '#11806A', // DarkAqua
    '#57F287', // Green
    '#1F8B4C', // DarkGreen
    '#3498DB', // Blue
    '#206694', // DarkBlue
    '#9B59B6', // Purple
    '#71368A', // DarkPurple
    '#E91E63', // LuminousVividPink
    '#AD1457', // DarkVividPink
    '#F1C40F', // Gold
    '#C27C0E', // DarkGold
    '#E67E22', // Orange
    '#A84300', // DarkOrange
    '#ED4245', // Red
    '#992D22', // DarkRed
    '#BCC0C0', // LightGrey
    '#FFFF00', // Yellow
  ];
  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex] || '#F1C40F';
}