const content = '.content';
const open = '.open';
const close = '.close';
const direction = '.direction';
const offset = '.offset';
const feature = '.feature';
const collection = '.collection';
const colors = '.colors';
const color = '.color';
const features = '.features';
const zindex = '.zindex';
const expandableAt = '.expandableAt';
const version = '.version';
const expanders = '.expanders';
const anchor = '.anchor';
const radii = '.radii';
const data = '.data';
const versions = '.versions';
const filter = '.filter';
const general = '.general';
const row = '.row';
const pixel = '.pixel';
const name = '.name';
const rgba = '.rgba';
const long = '.long';
const details = '.details';
const transparent = '.transparent';
const item = '.item';
const dotnugg = 'dotnugg';
const defaultOrItem = '.defaultOrItem';
const receiver = '.receiver';
const width = '.width';

const l = '.l';
const r = '.r';
const u = '.u';
const d = '.d';
const x = '.x';
const y = '.y';
const a = '.a';
const b = '.b';

const General = dotnugg + general;
const Item = dotnugg + item;
const Collection = dotnugg + collection;

const ItemContent = Item + content;
const ItemOpen = Item + open;
const ItemOpenFeature = ItemOpen + feature;
const ItemOpenDefaultOrItem = ItemOpen + defaultOrItem;

const ItemClose = Item + close;
const ItemColors = Item + colors;
const ItemColor = Item + color;

const ItemVersions = Item + versions;
const ItemVersion = Item + version;
const ItemVersionData = ItemVersion + data;

const ItemVersionRadii = ItemVersion + radii;
const ItemVersionRadiiDetails = ItemVersionRadii + details;
const ItemVersionRadiiDetailsR = ItemVersionRadiiDetails + r;
const ItemVersionRadiiDetailsL = ItemVersionRadiiDetails + l;
const ItemVersionRadiiDetailsU = ItemVersionRadiiDetails + u;
const ItemVersionRadiiDetailsD = ItemVersionRadiiDetails + d;

const ItemVersionExpanders = ItemVersion + expanders;
const ItemVersionExpandersDetails = ItemVersionExpanders + details;
const ItemVersionExpandersDetailsR = ItemVersionExpandersDetails + r;
const ItemVersionExpandersDetailsL = ItemVersionExpandersDetails + l;
const ItemVersionExpandersDetailsU = ItemVersionExpandersDetails + u;
const ItemVersionExpandersDetailsD = ItemVersionExpandersDetails + d;
const ItemVersionAnchor = ItemVersion + anchor;
const ItemVersionAnchorDetails = ItemVersionAnchor + details;
const ItemVersionAnchorDetailsX = ItemVersionAnchorDetails + x;
const ItemVersionAnchorDetailsY = ItemVersionAnchorDetails + y;

const ItemVersionName = ItemVersion + name;

const ItemColorsOpen = ItemColors + open;
const ItemVersionsOpen = ItemVersions + open;
const ItemVersionOpen = ItemVersion + open;
const ItemVersionDataOpen = ItemVersionData + open;

const ItemColorsClose = ItemColors + close;
const ItemVersionsClose = ItemVersions + close;
const ItemVersionClose = ItemVersion + close;
const ItemVersionDataClose = ItemVersionData + close;

const CollectionOpen = Collection + open;
const CollectionClose = Collection + close;
const CollectionOpenWidth = CollectionOpen + width;

const CollectionColors = Collection + colors;
const CollectionColor = Collection + color;

const CollectionColorsOpen = CollectionColors + open;
const CollectionColorsClose = CollectionColors + close;

const CollectionFeature = Collection + feature;
const CollectionFeatureName = CollectionFeature + name;

const CollectionFeatureDetails = CollectionFeature + details;
const CollectionFeatureDetailsClose = CollectionFeatureDetails + close;

const CollectionFeatureDetailsZIndex = CollectionFeatureDetails + zindex;
const CollectionFeatureDetailsZIndexDirection = CollectionFeatureDetailsZIndex + direction;
const CollectionFeatureDetailsZIndexOffset = CollectionFeatureDetailsZIndex + offset;
const CollectionFeatures = Collection + features;
const CollectionFeaturesOpen = CollectionFeatures + open;
const CollectionFeaturesClose = CollectionFeatures + close;

const GeneralColors = General + colors;
const GeneralColor = General + color;
const GeneralColorDetails = GeneralColor + details;
const GeneralColorName = GeneralColor + name;
const GeneralColorDetailsZIndex = GeneralColorDetails + zindex;
const GeneralColorDetailsZIndexOffset = GeneralColorDetailsZIndex + offset;
const GeneralColorDetailsZIndexDirection = GeneralColorDetailsZIndex + direction;
const GeneralColorDetailsRgba = GeneralColorDetails + rgba;

const GeneralReceiver = General + receiver;
const GeneralReceiverName = GeneralReceiver + name;
const GeneralReceiverDetails = GeneralReceiver + details;
const GeneralReceiverDetailsOpen = GeneralReceiverDetails + open;
const GeneralReceiverDetailsClose = GeneralReceiverDetails + close;
const GeneralReceiverDetailsFeature = GeneralReceiverDetails + feature;
const GeneralReceiverDetailsA = GeneralReceiverDetails + a;
const GeneralReceiverDetailsB = GeneralReceiverDetails + b;
const GeneralReceiverDetailsADirection = GeneralReceiverDetailsA + direction;
const GeneralReceiverDetailsBDirection = GeneralReceiverDetailsB + direction;
const GeneralReceiverDetailsAOffset = GeneralReceiverDetailsA + offset;
const GeneralReceiverDetailsBOffset = GeneralReceiverDetailsB + offset;
const GeneralData = General + data;
const GeneralDataRow = GeneralData + row;
const GeneralDataRowPixel = GeneralDataRow + pixel;
const GeneralDataRowPixelTransparent = GeneralDataRowPixel + transparent;
const GeneralDataRowPixelFilter = GeneralDataRowPixel + filter;
const GeneralDataRowPixelColor = GeneralDataRowPixel + color;

const GeneralColorsOpen = GeneralColors + open;
const GeneralDataOpen = GeneralData + open;
const GeneralColorsClose = GeneralColors + close;
const GeneralDataClose = GeneralData + close;

const CollectionFeatureClose = CollectionFeature + close;
const GeneralColorDetailsClose = GeneralColorDetails + close;
const ItemVersionRadiiDetailsClose = ItemVersionRadiiDetails + close;
const ItemVersionExpandersDetailsClose = ItemVersionExpandersDetails + close;
const ItemVersionAnchorDetailsClose = ItemVersionAnchorDetails + close;

const CollectionFeatureDetailsExpandableAt = CollectionFeatureDetails + expandableAt;
const CollectionFeatureDetailsExpandableAtDetails = CollectionFeatureDetailsExpandableAt + details;
const CollectionFeatureDetailsExpandableAtDetailsR = CollectionFeatureDetailsExpandableAtDetails + r;
const CollectionFeatureDetailsExpandableAtDetailsL = CollectionFeatureDetailsExpandableAtDetails + l;
const CollectionFeatureDetailsExpandableAtDetailsU = CollectionFeatureDetailsExpandableAtDetails + u;
const CollectionFeatureDetailsExpandableAtDetailsD = CollectionFeatureDetailsExpandableAtDetails + d;

const CollectionFeatureLong = CollectionFeature + long;
const CollectionFeatureLongName = CollectionFeatureLong + name;

const CollectionFeatureLongOpen = CollectionFeatureLong + open;
const CollectionFeatureLongClose = CollectionFeatureLong + close;
const CollectionFeatureLongZIndex = CollectionFeatureLong + zindex;
const CollectionFeatureLongReceiver = CollectionFeatureLong + receiver;

const CollectionFeatureLongZIndexDirection = CollectionFeatureLongZIndex + direction;
const CollectionFeatureLongZIndexOffset = CollectionFeatureLongZIndex + offset;
const CollectionFeatureLongExpandableAt = CollectionFeatureLong + expandableAt;
const CollectionFeatureLongExpandableAtDetails = CollectionFeatureLongExpandableAt + details;
const CollectionFeatureLongExpandableAtDetailsR = CollectionFeatureLongExpandableAtDetails + r;
const CollectionFeatureLongExpandableAtDetailsL = CollectionFeatureLongExpandableAtDetails + l;
const CollectionFeatureLongExpandableAtDetailsU = CollectionFeatureLongExpandableAtDetails + u;
const CollectionFeatureLongExpandableAtDetailsD = CollectionFeatureLongExpandableAtDetails + d;
const CollectionFeatureLongExpandableAtDetailsOpen = CollectionFeatureLongExpandableAtDetails + open;
const CollectionFeatureLongExpandableAtDetailsClose = CollectionFeatureLongExpandableAtDetails + close;

export default {
    Item,
    ItemContent,
    ItemOpen,
    ItemOpenFeature,
    ItemClose,
    ItemColors,
    ItemVersion,
    ItemVersions,
    ItemVersionRadii,
    ItemVersionExpanders,
    ItemVersionAnchor,
    ItemVersionData,
    Collection,
    ItemColorsOpen,
    ItemVersionsOpen,
    ItemVersionOpen,
    ItemVersionDataOpen,
    ItemColorsClose,
    ItemVersionsClose,
    ItemVersionClose,
    ItemVersionDataClose,
    CollectionColors,
    CollectionColorsOpen,
    CollectionColorsClose,
    CollectionFeature,
    CollectionFeatures,
    CollectionFeaturesOpen,
    CollectionFeaturesClose,

    GeneralColors,
    GeneralColor,
    GeneralData,
    GeneralDataRow,
    GeneralDataRowPixel,
    GeneralColorsOpen,
    GeneralDataOpen,
    GeneralColorsClose,
    GeneralDataClose,
    CollectionOpen,
    CollectionClose,
    CollectionColor,
    ItemColor,
    CollectionFeatureDetailsZIndex,
    CollectionFeatureName,

    CollectionFeatureDetailsZIndexDirection,
    CollectionFeatureDetailsZIndexOffset,
    GeneralColorDetailsZIndexOffset,
    GeneralColorDetailsZIndexDirection,
    GeneralColorDetails,
    GeneralColorDetailsZIndex,
    GeneralColorName,
    GeneralColorDetailsRgba,

    GeneralDataRowPixelTransparent,
    GeneralDataRowPixelFilter,
    GeneralDataRowPixelColor,
    ItemVersionName,
    ItemVersionRadiiDetails,
    ItemVersionRadiiDetailsR,
    ItemVersionRadiiDetailsL,
    ItemVersionRadiiDetailsU,
    ItemVersionRadiiDetailsD,
    ItemVersionExpandersDetails,
    ItemVersionExpandersDetailsR,
    ItemVersionExpandersDetailsL,
    ItemVersionExpandersDetailsU,
    ItemVersionExpandersDetailsD,
    ItemVersionAnchorDetails,
    ItemVersionAnchorDetailsX,
    ItemVersionAnchorDetailsY,
    CollectionFeatureClose,
    CollectionFeatureDetailsClose,
    ItemVersionRadiiDetailsClose,
    ItemVersionExpandersDetailsClose,
    GeneralColorDetailsClose,
    ItemVersionAnchorDetailsClose,

    ItemOpenDefaultOrItem,
    GeneralReceiver,
    GeneralReceiverName,
    GeneralReceiverDetails,
    GeneralReceiverDetailsOpen,
    GeneralReceiverDetailsClose,
    GeneralReceiverDetailsFeature,
    GeneralReceiverDetailsA,
    GeneralReceiverDetailsB,
    CollectionFeatureDetailsExpandableAt,
    CollectionFeatureDetailsExpandableAtDetails,
    CollectionFeatureDetailsExpandableAtDetailsR,
    CollectionFeatureDetailsExpandableAtDetailsL,
    CollectionFeatureDetailsExpandableAtDetailsU,
    CollectionFeatureDetailsExpandableAtDetailsD,
    CollectionFeatureLong,
    CollectionFeatureLongOpen,
    CollectionFeatureLongClose,
    CollectionFeatureLongZIndex,
    CollectionFeatureLongReceiver,
    CollectionFeatureLongZIndexDirection,
    CollectionFeatureLongZIndexOffset,
    CollectionFeatureLongExpandableAt,
    CollectionFeatureLongExpandableAtDetails,
    CollectionFeatureLongExpandableAtDetailsR,
    CollectionFeatureLongExpandableAtDetailsL,
    CollectionFeatureLongExpandableAtDetailsU,
    CollectionFeatureLongExpandableAtDetailsD,
    GeneralReceiverDetailsADirection,
    GeneralReceiverDetailsBDirection,
    GeneralReceiverDetailsAOffset,
    GeneralReceiverDetailsBOffset,
    CollectionFeatureLongExpandableAtDetailsOpen,
    CollectionFeatureLongExpandableAtDetailsClose,
    CollectionFeatureLongName,
    CollectionOpenWidth,
};
