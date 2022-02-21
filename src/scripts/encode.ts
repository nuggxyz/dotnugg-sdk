import { dotnugg } from '..';

const main = async (repo: string) => {
    await dotnugg.parser.init('other/encode-script');
    dotnugg.timer.start('compile');
    const enc = dotnugg.compiler.compileDirectoryCheckCache(repo);
    dotnugg.timer.stop('compile');

    dotnugg.timer.start('hex');
    enc.hexFromId(0, 1);
    dotnugg.timer.stop('hex');

    dotnugg.timer.start('compress');

    // console.log('encoded:    ', (enc.encoded.toString().length / 1000).toFixed(3), 'KB');
    console.log('compressed: ', (enc.compileTimeBytecodeEncoded.toString().length / 1000).toFixed(3), 'KB');
    dotnugg.timer.stop('compress');

    console.log(enc.compileTimeBytecodeEncoded);

    // console.log(enc.outputByItem(4, 2));
};
main(`../${process.argv[2]}`);
