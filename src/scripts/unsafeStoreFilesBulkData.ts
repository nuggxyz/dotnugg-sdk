import * as fs from 'fs';
import * as path from 'path';

import { dotnugg } from '..';

const main = async (repo: string, solFileDir: string) => {
    await dotnugg.compile.Compiler.init();

    const res = dotnugg.compile.Compiler.compileDirectoryWithCache(repo);

    const data = await res.encoder.bulkupload;

    var dir = path.join(solFileDir);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    console.log(dir);
    fs.writeFile(
        path.join(solFileDir, 'GeneratedDotnuggV1LocalUploader.sol'),
        `
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
    
interface IGeneratedDotnuggV1StorageHelper {
    function totalStoredFiles(address implementer, uint8 feature) external view returns (uint8);
}

abstract contract GeneratedDotnuggV1LocalUploader {
    function dotnuggV1CallbackHelper(uint256 tokenId, address processor) internal view virtual returns (uint8[] memory data) {
        data = new uint8[](8);

        data[0] = _randSeedFromTotalStoredFiles(tokenId, 0, processor);
        data[1] = _randSeedFromTotalStoredFiles(tokenId, 1, processor);
        data[2] = _randSeedFromTotalStoredFiles(tokenId, 2, processor);
        data[3] = _randSeedFromTotalStoredFiles(tokenId, 3, processor);
        data[4] = _randSeedFromTotalStoredFiles(tokenId, 4, processor);
        data[5] = _randSeedFromTotalStoredFiles(tokenId, 5, processor);
        data[6] = _randSeedFromTotalStoredFiles(tokenId, 6, processor);
        data[7] = _randSeedFromTotalStoredFiles(tokenId, 7, processor);
    }

    function _randSeedFromTotalStoredFiles(
        uint256 tokenId,
        uint8 feature,
        address processor
    ) private view returns (uint8 res) {
        res = IGeneratedDotnuggV1StorageHelper(processor).totalStoredFiles(address(this), feature);

        if (res == 0) return 0;

        uint256 seed = uint256(keccak256(abi.encodePacked(tokenId)));

        res = ((uint8(seed >> (feature * 8)) & 0xff) % res) + 1;
    }

    constructor(address processor) {
        bool success;

        bytes memory _data = __data;

        assembly {
            success := call(gas(), processor, 0, add(_data, 32), mload(_data), 0, 0)
        }

        require(success, 'ERROR');
    }

    bytes __data = hex'${data.toString().substring(2)}';
}`,
        function (err) {
            if (err) throw err;
            console.log('Saved!');
        },
    );
};

main(`../${process.argv[2]}`, `../${process.argv[3]}/src/_generated/`);
