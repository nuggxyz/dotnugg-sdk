import { dotnugg } from '..';

const main = async (repo: string) => {
    await dotnugg.parser.init();

    const enc = dotnugg.compiler.compileDirectoryCheckCache(repo);

    // console.log('encoded:    ', (enc.encoded.toString().length / 1000).toFixed(3), 'KB');
    console.log('compressed: ', (enc.compileTimeBytecodeEncoded.toString().length / 1000).toFixed(3), 'KB');

    // console.log(enc.compressed);

    console.log(enc.outputByItem(4, 2));
};
main(`../${process.argv[2]}`);
