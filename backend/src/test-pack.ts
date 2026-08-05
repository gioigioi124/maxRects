import { MaxRectsPacker } from 'maxrects-packer';

const packer = new MaxRectsPacker(1600, 2000, 0, { smart: true, pot: false, square: false, allowRotation: true });
packer.addArray([
  { width: 100, height: 200, data: { id: 1 } } as any,
  { width: 300, height: 2100, data: { id: 2 } } as any
]);

console.log(JSON.stringify(packer.bins, null, 2));
