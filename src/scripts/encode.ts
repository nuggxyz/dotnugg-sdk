import { dotnugg } from '..';

const main = async (repo: string) => {
    await dotnugg.compiler.init();

    const enc = dotnugg.compiler.compileDirectoryCheckCache(repo);

    console.log('encoded:    ', (enc.encoded.toString().length / 1000).toFixed(3), 'KB');
    console.log('compressed: ', (enc.compressed.toString().length / 1000).toFixed(3), 'KB');

    console.log(enc.compressed);
};
main(`../${process.argv[2]}`);
