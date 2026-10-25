"""Prepare the approved P3.3B synthetic fixtures offline; never calls an API.

python scripts/prepare-p33b-inputs.py --write  # before manifest registration only
python scripts/prepare-p33b-inputs.py --check  # read-only reproducibility/preflight

Requires Pillow 12.3.0 with JPEG codec 8.0. Existing committed JPEG bytes are
the trial inputs; another encoder version must not silently replace them.
"""

import argparse
import hashlib
import io
import json
from pathlib import Path

import PIL
from PIL import Image, ImageDraw, features


ROOT = Path(__file__).resolve().parents[1]
BACKGROUND = (248, 245, 239)
MAX_BYTES = 1_000_000
MODEL = "gpt-image-2.5-flare-2026-09-08"
PARAMETERS = {
    "n": 1, "quality": "medium", "size": "1024x1536",
    "background": "opaque", "output_format": "png", "moderation": "auto",
}


def garment(key, source, category, label, description, crop, polygon, limitations):
    return dict(key=key, source=source, category=category, label=label,
                description=description, crop=crop, polygon=polygon,
                limitations=limitations)


# Coordinates refer to the original 1024 x 1536 pixels. Polygons retain only
# visible source pixels. They do not reconstruct occluded fabric or anatomy.
GARMENTS = {
    "w-knit": garment("w-knit", "w1", "top", "Kremowy sweter",
        "cream long-sleeve crew-neck knit sweater, relaxed shape",
        [285, 245, 725, 660],
        [[450,278],[575,268],[598,262],[673,280],[700,339],[706,466],
         [697,544],[690,640],[645,635],[626,572],[624,627],[550,600],
         [497,574],[404,574],[363,592],[350,641],[312,634],[312,557],
         [306,519],[316,409],[333,316],[386,285]],
        ["Sweter wycięty z ilustracji na osobie; dół jest częściowo podwinięty lub wsunięty w spodnie.",
         "Krawędź dekoltu styka się z włosami; wycinek nie pokazuje tyłu rzeczy."]),
    "w-wide": garment("w-wide", "w1", "bottom", "Granatowe szerokie spodnie",
        "navy high-waisted wide-leg trousers with long, very wide hems",
        [325, 560, 750, 1420],
        [[379,584],[490,579],[550,602],[620,636],[639,730],[658,845],
         [674,1051],[730,1367],[721,1398],[575,1400],[525,1220],
         [497,1050],[488,912],[489,813],[477,862],[485,1070],
         [520,1367],[377,1374],[355,1234],[345,914],[342,821],[345,700]],
        ["Pas spodni jest częściowo zasłonięty swetrem; zachowano tylko widoczne piksele.",
         "Drobne fragmenty dłoni mogą zachodzić na boki spodni. Nie jest to flat-lay."]),
    "w-sneakers": garment("w-sneakers", "w1", "shoes", "Białe sneakersy",
        "white low-top sneakers with thick white soles",
        [380, 1340, 785, 1470],
        [[409,1384],[439,1366],[480,1367],[519,1366],[519,1400],
         [494,1414],[459,1425],[407,1421],[405,1400],
         [409,1384]],
        ["Górę obuwia zasłaniają nogawki; widoczne są głównie przody i podeszwy."]),
    "m-knit": garment("m-knit", "m1", "top", "Sweter ecru",
        "ecru long-sleeve crew-neck knit sweater with a ribbed hem and cuffs",
        [250, 215, 750, 730],
        [[454,231],[475,263],[522,277],[550,269],[572,234],[647,258],
         [690,293],[715,375],[724,510],[721,569],[700,646],[657,635],
         [647,592],[645,688],[601,707],[515,709],[428,699],[360,680],
         [354,615],[303,631],[276,561],[278,486],[283,387],[311,301],[387,258]],
        ["Sweter pochodzi z obrazu na osobie; krawędzie szyi i nadgarstków nie są produktem flat-lay."]),
    "m-chinos": garment("m-chinos", "m1", "bottom", "Granatowe chinosy",
        "navy slim straight chinos, ankle-length, with modest taper",
        [315, 675, 690, 1375],
        [[357,683],[432,703],[520,712],[607,705],[650,691],[665,749],
         [663,1008],[649,1196],[643,1358],[562,1360],[536,1180],
         [518,1011],[505,847],[494,806],[486,901],[506,1121],
         [500,1340],[428,1347],[405,1246],[388,1090],[347,843],[338,746]],
        ["Sweter zakrywa pas; dłonie schowane w kieszeniach zasłaniają ich górne krawędzie."]),
    "m-sneakers": garment("m-sneakers", "m1", "shoes", "Białe sneakersy",
        "white low-top lace-up sneakers with white soles",
        [360, 1320, 715, 1480],
        [[427,1343],[499,1340],[510,1390],[485,1427],[439,1446],
         [382,1449],[381,1427],[399,1391]],
        ["Nogawki zasłaniają tył cholewek; zachowano trochę skóry przy kostkach."]),
    "w-shirt": garment("w-shirt", "w4", "top", "Błękitna koszula — widoczny przód",
        "pale-blue collared button-up shirt, tucked in; visible front panel only",
        [420, 245, 605, 560],
        [[449,257],[464,289],[493,335],[508,369],[526,327],[537,292],
         [545,255],[555,311],[558,373],[566,434],[582,514],
         [588,547],[439,541],[442,467],[445,363]],
        ["Marynarka zasłania rękawy, ramiona, boczne szwy i część kołnierza koszuli; nie odtwarzano tych części.",
         "W wycięciu dekoltu pozostaje fragment skóry. Marynarka nie jest wejściem ani częścią zestawu B03."]),
    "w-tailored": garment("w-tailored", "w4", "bottom", "Granatowe proste spodnie garniturowe",
        "navy tailored trousers with straight moderately wide legs and ankle-length hems; not skinny or flared",
        [325, 530, 685, 1400],
        [[442,547],[584,551],[602,599],[616,643],[636,691],[637,750],
         [647,818],[654,1004],[662,1372],[562,1377],[529,1160],
         [508,963],[493,819],[482,769],[475,878],[487,1110],
         [502,1339],[402,1344],[380,1192],[365,1001],[346,845],
         [344,770],[381,764],[412,745],[427,687]],
        ["Marynarka i dłoń zasłaniają boki pasa/kieszeni; obrys maski nie jest rzeczywistym górnym krojem spodni.",
         "Ocena kroju dotyczy przede wszystkim widocznych prostych nogawek i długości, nie ukrytych partii."]),
    "w-loafers": garment("w-loafers", "w4", "shoes", "Czarne mokasyny",
        "black leather penny loafers with low heels",
        [385, 1320, 740, 1475],
        [[431,1348],[486,1341],[500,1337],[504,1382],[489,1403],
         [460,1416],[414,1418],[404,1403],[409,1383]],
        ["Nogawki zakrywają górę butów; nad cholewkami pozostają fragmenty kostek."]),
    "m-shirt": garment("m-shirt", "m4", "top", "Biała koszula — widoczny przód",
        "white collared button-up dress shirt, tucked in, open collar, no tie; visible front only",
        [420, 215, 605, 610],
        [[449,228],[466,264],[497,302],[525,260],[542,220],[549,267],
         [550,373],[554,471],[572,545],[592,591],[439,589],
         [445,527],[449,422],[449,313]],
        ["Marynarka zasłania rękawy, ramiona i boki koszuli; widoczny jest tylko przód i część kołnierza.",
         "Zostaje skóra przy kołnierzu. Marynarka została wykluczona z wejścia i z docelowego stroju B04."]),
    "m-tailored": garment("m-tailored", "m4", "bottom", "Grafitowe spodnie garniturowe",
        "charcoal tailored trousers with straight moderately tapered legs and full-length hems",
        [345, 580, 685, 1345],
        [[443,597],[592,596],[613,644],[637,688],[650,738],[648,805],
         [653,986],[661,1317],[591,1325],[559,1183],[536,1034],
         [511,843],[504,797],[492,870],[497,1081],[520,1286],
         [447,1295],[423,1195],[396,1026],[370,829],[360,762],
         [383,759],[410,736],[425,680]],
        ["Marynarka i ręka zasłaniają kieszenie i zewnętrzne części pasa; wycinek zachowuje tylko widoczną tkaninę."]),
    "m-derby": garment("m-derby", "m4", "shoes", "Czarne półbuty derby",
        "black lace-up leather derby dress shoes with low heels",
        [385, 1260, 735, 1435],
        [[447,1289],[504,1287],[517,1276],[524,1325],[504,1354],
         [465,1375],[420,1383],[404,1372],[408,1352],[432,1313]],
        ["Spodnie zasłaniają górę cholewek; wycinek nie pokazuje tyłu butów."]),
    "w-dress": garment("w-dress", "w5", "dress", "Niebieska sukienka midi",
        "muted blue midi dress with short flutter sleeves, fitted waist and softly flared skirt below the knees",
        [285, 245, 775, 1145],
        [[384,263],[426,262],[452,274],[512,282],[568,275],[598,262],
         [640,272],[666,304],[693,388],[663,403],[644,396],[628,391],
         [615,463],[615,503],[648,606],[675,698],[689,784],[712,902],
         [756,1077],[736,1089],[699,1098],[659,1102],[611,1119],
         [558,1123],[512,1120],[466,1128],[412,1115],[359,1121],
         [336,1111],[301,1094],[322,1044],[339,969],[355,890],
         [375,791],[390,702],[411,602],[421,519],[422,487],
         [405,411],[403,395],[365,390],[345,391],[319,378],
         [339,330],[357,282]],
        ["Dłonie i ramiona zasłaniają małe części boków sukienki; wycinek nie odtwarza zasłoniętej tkaniny.",
         "Krawędź maski przy rękawach jest technicznym wycięciem, nie zdjęciem produktu na płasko."]),
    "w-pumps": garment("w-pumps", "w5", "shoes", "Beżowe czółenka",
        "nude beige closed-toe pumps with medium heels",
        [275, 1280, 590, 1470],
        [[332,1355],[360,1322],[384,1300],[397,1314],[394,1350],
         [383,1395],[369,1427],[330,1448],[305,1451],[299,1436],
         [309,1399]],
        ["W czółenkach pozostają fragmenty stóp i kostek. To wycinek obuwia noszonego na osobie."]),
    "m-wedding-shirt": garment("m-wedding-shirt", "m5", "top", "Biała koszula z granatowym krawatem — przód",
        "white dress shirt with a navy tie, tucked in; the shirt-and-tie reference is one declared top input, visible front only",
        [405, 215, 605, 630],
        [[454,223],[469,246],[499,264],[518,256],[550,218],[560,264],
         [559,377],[562,473],[571,550],[587,597],[532,600],
         [514,619],[483,600],[420,595],[441,535],[450,472],[455,376]],
        ["Koszula i krawat to jawnie jedna pozycja wejściowa (tak jak w katalogu); nie dołączono marynarki.",
         "Widoczny jest tylko przód koszuli. Rękawy, ramiona, boki oraz fragmenty kołnierza zasłania marynarka; szyja częściowo pozostaje."]),
    "m-wedding-trousers": garment("m-wedding-trousers", "m5", "bottom", "Granatowe spodnie garniturowe",
        "navy tailored suit trousers with straight legs and full-length hems",
        [335, 585, 715, 1350],
        [[421,604],[482,605],[514,621],[533,605],[583,604],[594,653],
         [613,717],[636,762],[645,826],[675,1025],[699,1332],
         [608,1334],[581,1181],[554,1043],[525,863],[513,807],
         [499,873],[503,1084],[503,1304],[421,1318],[391,1169],
         [370,985],[352,831],[355,751],[381,712],[408,660]],
        ["Krawat, marynarka i dłoń zasłaniają części pasa/kieszeni; nie odtworzono ukrytych partii.",
         "Marynarka nie jest czwartą rzeczą zestawu. Męski przypadek weselny sprawdza koszulę bez marynarki, spodnie i buty."]),
    "m-wedding-shoes": garment("m-wedding-shoes", "m5", "shoes", "Czarne sznurowane półbuty",
        "black lace-up leather dress shoes with low heels",
        [375, 1285, 750, 1450],
        [[430,1314],[499,1304],[509,1325],[508,1363],[475,1386],
         [440,1400],[400,1403],[395,1392],[401,1364]],
        ["Nogawki zasłaniają górę obuwia; widok przodu i boków, bez tyłu."]),
}

# Both shoes are retained as separate regions of the same footwear image.
SHOE_SECOND_POLYGONS = {
    "w-sneakers": [[572,1402],[624,1392],[655,1374],[696,1378],[721,1393],[757,1436],[761,1450],[736,1455],[683,1446],[628,1429],[573,1416]],
    "m-sneakers": [[563,1359],[595,1355],[627,1361],[647,1381],[681,1420],[695,1449],[691,1466],[651,1466],[607,1451],[566,1426],[550,1402]],
    "w-loafers": [[562,1377],[608,1380],[636,1375],[656,1392],[696,1419],[717,1439],[720,1455],[692,1460],[643,1451],[607,1437],[557,1424],[556,1402]],
    "m-derby": [[590,1326],[625,1324],[659,1320],[665,1352],[687,1378],[707,1398],[714,1417],[693,1424],[659,1422],[629,1411],[591,1386],[588,1350]],
    "w-pumps": [[506,1353],[516,1308],[528,1290],[544,1301],[552,1332],[560,1353],[570,1375],[570,1394],[553,1415],[535,1424],[516,1417],[505,1400]],
    "m-wedding-shoes": [[609,1335],[648,1335],[685,1333],[697,1353],[701,1379],[721,1402],[731,1424],[733,1437],[702,1440],[661,1430],[627,1413],[602,1394],[600,1365]],
}

CASE_SPECS = [
    ("B01", "Kobieta / na co dzień", "women", "casual", "w3", ["w-knit", "w-wide", "w-sneakers"]),
    ("B02", "Mężczyzna / na co dzień", "men", "casual", "m3", ["m-knit", "m-chinos", "m-sneakers"]),
    ("B03", "Kobieta / elegancko", "women", "elegant", "w3", ["w-shirt", "w-tailored", "w-loafers"]),
    ("B04", "Mężczyzna / elegancko", "men", "elegant", "m3", ["m-shirt", "m-tailored", "m-derby"]),
    ("B05", "Kobieta / wesele jako gość", "women", "wedding", "w3", ["w-dress", "w-pumps"]),
    ("B06", "Mężczyzna / wesele jako gość", "men", "wedding", "m3", ["m-wedding-shirt", "m-wedding-trousers", "m-wedding-shoes"]),
]


def digest(data):
    return hashlib.sha256(data).hexdigest()


def encode_image(source, definition=None):
    source_path = ROOT / "assets" / "outfits" / f"{source}.png"
    source_bytes = source_path.read_bytes()
    with Image.open(io.BytesIO(source_bytes)) as opened:
        assert opened.size == (1024, 1536)
        original = opened.convert("RGB")
    if definition:
        mask = Image.new("L", original.size, 0)
        draw = ImageDraw.Draw(mask)
        polygons = [definition["polygon"]]
        if definition["key"] in SHOE_SECOND_POLYGONS:
            polygons.append(SHOE_SECOND_POLYGONS[definition["key"]])
        for polygon in polygons:
            draw.polygon([tuple(point) for point in polygon], fill=255)
        image = Image.new("RGB", original.size, BACKGROUND)
        image.paste(original, (0, 0), mask)
        image = image.crop(tuple(definition["crop"]))
        # Padding preserves the garment scale; no synthetic reconstruction/upscale.
        canvas = Image.new("RGB", (image.width + 48, image.height + 48), BACKGROUND)
        canvas.paste(image, (24, 24))
        image = canvas
        transform = {"crop": definition["crop"], "keepPolygons": polygons,
                     "paddingPixels": 24, "backgroundRgb": list(BACKGROUND),
                     "method": "manual-visible-pixel-mask-and-crop-no-inpainting"}
    else:
        image = original
        transform = {"method": "full-image-rgb-jpeg-reencode"}
    assert image.width <= 1024 and image.height <= 1536
    output = io.BytesIO()
    # A fresh RGB image and explicit JPEG encoding discard EXIF/ICC/XMP.
    clean = Image.new("RGB", image.size)
    clean.paste(image)
    clean.save(output, format="JPEG", quality=90, subsampling=0,
               optimize=False, progressive=False, exif=b"")
    data = output.getvalue()
    assert len(data) <= MAX_BYTES
    with Image.open(io.BytesIO(data)) as checked:
        assert checked.format == "JPEG" and not checked.getexif()
        assert "icc_profile" not in checked.info and "xmp" not in checked.info
    return data, dict(sourcePath=source_path.relative_to(ROOT).as_posix(),
                      sourceSha256=digest(source_bytes), sourceWidth=1024,
                      sourceHeight=1536, transform=transform,
                      width=image.width, height=image.height)


def build_prompt(inputs):
    garment_text = " ".join(
        f"Image {entry['order']}: {entry['description']}." for entry in inputs[1:])
    return (
        "Edit image 1: show the same fictional adult wearing only the declared garments "
        "in the separate reference images. Image 1 alone defines the person: preserve face, "
        "hair, skin tone, apparent adult age, body proportions, pose, camera, full-body framing, "
        "lighting and studio background. Replace all current clothing and footwear; do not retain "
        "a cardigan, jacket or other layer from image 1. " + garment_text + " "
        "References 2 onward are cropped visible garment pixels from illustrations of other "
        "fictional adults, not flat-lay photos. Ignore their residual skin, hands and neutral "
        "mask edges. Do not copy their person, pose or body. Some shirt sleeves, shoulders, "
        "waistbands and shoe uppers were occluded and are absent. Infer only the minimum "
        "continuous fabric needed to wear each declared garment; do not interpret the mask "
        "outline as a garment cut or add an outer layer. Preserve the visible colours, fabric, "
        "closures, neckline, trouser leg width, rise where visible, and hem length. A shirt "
        "reference means that shirt worn alone, never a blazer. Keep both shoes, whole head, "
        "natural hands and realistic anatomy visible. No added accessories, jewellery, text, "
        "logos, other people, collage or comparison board. Return one photorealistic outfit "
        "visualisation; this does not establish physical fit."
    )


def prepare():
    files, cases = {}, []
    for index, (case_id, label, audience, occasion, person, keys) in enumerate(CASE_SPECS):
        inputs = []
        for order, key in enumerate([None, *keys], 1):
            definition = GARMENTS[key] if key else None
            source = definition["source"] if definition else person
            data, provenance = encode_image(source, definition)
            path = f"public/p33b/inputs/{case_id.lower()}-{order:02d}-{'person' if key is None else key}.jpg"
            files[path] = data
            entry = dict(order=order, path=path, publicPath=path.removeprefix("public/"),
                         role="garment" if key else "person", mimeType="image/jpeg",
                         sha256=digest(data), bytes=len(data), **provenance)
            if definition:
                entry.update(garmentId=key, category=definition["category"],
                             label=definition["label"], description=definition["description"],
                             limitations=definition["limitations"])
            else:
                entry.update(label="Fikcyjna dorosła osoba — wzorzec tożsamości i pozy",
                             limitations=["Istniejące ubrania osoby są wyłącznie kontekstem wejściowym; cały strój ma zostać zastąpiony.",
                                          "Syntetyczne postacie w tej małej bazie są do siebie podobne; próba słabo bada zmianę tożsamości i różnorodność sylwetek."])
            inputs.append(entry)
        prompt = build_prompt(inputs)
        assert len(prompt) <= 2500
        cases.append(dict(id=case_id, order=index + 1, label=label, audience=audience,
                          occasion=occasion, syntheticAccountSlot="woman" if audience == "women" else "man",
                          calibration=index == 0, status="pending", garmentCount=len(keys),
                          inputs=inputs, prompt=prompt, promptSha256=digest(prompt.encode("utf-8")),
                          result=None, qualityAssessment=None))
    manifest = dict(version="1.0", preparedDate="2026-10-25", status="prepared-offline",
                    model=MODEL, endpoint="https://api.openai.com/v1/images/edits",
                    parameters=PARAMETERS,
                    limits=dict(maxCallsTotal=6, budgetPlnTotal=10, concurrency=1,
                                maxSendsPerCase=1, automaticRetries=0,
                                maxInputBytes=MAX_BYTES, maxInputWidth=1024,
                                maxInputHeight=1536, maxPromptCharacters=2500),
                    preprocessing=dict(script="scripts/prepare-p33b-inputs.py", pillow="12.3.0",
                                       jpegCodec="8.0", jpegQuality=90, jpegSubsampling=0,
                                       exif=False, backgroundRgb=list(BACKGROUND), generatedImages=0),
                    executionGate="Offline inputs only. Registration, access, financing, worker checks and controlled activation are separate prerequisites. This file cannot authorize a provider call.",
                    inputLimitations=["Visible-pixel crops, not independent product photos or flat-lay images.",
                                      "No hidden fourth layer: B03/B04/B06 shirts are worn without blazers; B06 declares shirt plus tie as one top input.",
                                      "Occluded garment areas are absent, not reconstructed; their output fidelity cannot be validated.",
                                      "Only a small, visually similar set of fictional adults; no claim of broad identity/body diversity validation."],
                    cases=cases)
    serialized = (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    files["docs/p33b/cases.json"] = serialized
    files["public/p33b/cases.json"] = serialized
    return files, manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--write", action="store_true")
    mode.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if PIL.__version__ != "12.3.0" or features.version_codec("jpg") != "8.0":
        raise SystemExit("Encoder version differs. Do not replace the frozen trial bytes; use Pillow 12.3.0 / JPEG 8.0.")
    files, manifest = prepare()
    if args.write:
        summary_path = ROOT / "public/p33b/summary.json"
        if summary_path.exists():
            summary = json.loads(summary_path.read_text(encoding="utf-8"))
            if summary.get("calls", 0) != 0 or any(case.get("status", "pending") != "pending" for case in summary.get("cases", [])):
                raise SystemExit("Trial activity recorded. Inputs must remain frozen; --write refused.")
        for relative, data in files.items():
            target = ROOT / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
    else:
        for relative, expected in files.items():
            actual = (ROOT / relative).read_bytes()
            if actual != expected:
                raise SystemExit(f"Frozen file mismatch: {relative}")
    images = [entry for case in manifest["cases"] for entry in case["inputs"]]
    print(json.dumps(dict(mode="write" if args.write else "check", cases=len(manifest["cases"]),
                          images=len(images), largestInputBytes=max(x["bytes"] for x in images),
                          maxPromptCharacters=max(len(x["prompt"]) for x in manifest["cases"]),
                          manifestSha256=digest(files["docs/p33b/cases.json"]), result="PASS")))


if __name__ == "__main__":
    main()
