import invariant from 'tiny-invariant';

export const randIntBetween = (max: number) => {
    invariant(max <= 1000000, 'RANDBETWEEN:TOBIG');
    return Math.floor(Math.random() * 1000000) % max;
};
