import { dotnugg } from '..';

const main = async (repo: string) => {
    await dotnugg.compile.Compiler.init();

    const enc = dotnugg.compile.Compiler.compileDirectoryWithCache(repo).encoder.encoded;

    console.log(enc);
};
main(`../${process.argv[2]}`);
