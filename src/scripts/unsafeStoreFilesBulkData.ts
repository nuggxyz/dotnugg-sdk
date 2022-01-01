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
    function stored(address implementer, uint8 feature) external view returns (uint8);
}

abstract contract GeneratedDotnuggV1LocalUploader {
    address constant CONSOLE_ADDRESS = address(0x000000000000000000636F6e736F6c652e6c6f67);

    function _sendLogPayload(bytes memory payload) private view {
        uint256 payloadLength = payload.length;
        address consoleAddress = CONSOLE_ADDRESS;
        assembly {
            let payloadStart := add(payload, 32)
            let r := staticcall(gas(), consoleAddress, payloadStart, payloadLength, 0, 0)
        }
    }

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

    function dotnuggV1CallbackHelper(
        uint256 tokenId,
        address processor,
        uint8 extra
    ) internal view virtual returns (uint8[] memory data) {
        data = new uint8[](8);

        require(extra > 2 && extra < 8, 'EXTRA SHOULD BE BETWEEN 3 and 7 (inclusive)');

        data[0] = _randSeedFromTotalStoredFiles(tokenId, 0, processor);
        data[1] = _randSeedFromTotalStoredFiles(tokenId, 1, processor);
        data[2] = _randSeedFromTotalStoredFiles(tokenId, 2, processor);
        // data[extra] = _randSeedFromTotalStoredFiles(tokenId, extra, processor);

        if (tokenId % 2 == 0) {
            data[3] = _randSeedFromTotalStoredFiles(tokenId, 3, processor);
        } else {
            data[4] = _randSeedFromTotalStoredFiles(tokenId, 4, processor);
        }

        if (tokenId % 13 == 0) {
            data[5] = _randSeedFromTotalStoredFiles(tokenId, 5, processor);
        } else if (tokenId % 21 == 0) {
            data[6] = _randSeedFromTotalStoredFiles(tokenId, 6, processor);
        } else if (tokenId % 25 == 0) {
            data[7] = _randSeedFromTotalStoredFiles(tokenId, 7, processor);
        }
    }

    function _randSeedFromTotalStoredFiles(
        uint256 tokenId,
        uint8 feature,
        address processor
    ) private view returns (uint8 res) {
        res = IGeneratedDotnuggV1StorageHelper(processor).stored(address(this), feature);

        if (res == 0) return 0;

        uint256 seed = uint256(keccak256(abi.encodePacked(tokenId, "SUperranDOm2")));

        res = ((uint8(seed >> (feature * 8)) & 0xff) % res) + 1;

        _sendLogPayload(abi.encodeWithSignature('log(string,uint256,string,uint256)', 'random id selected for feature ', feature, ' - ', res));
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
