import json
import copy


def build_translation_maps(en_path, zh_path):
    # 加载 en.json
    with open(en_path, 'r', encoding='utf-8') as f:
        en_data = json.load(f)
    # 加载 zh_Hans.json
    with open(zh_path, 'r', encoding='utf-8') as f:
        zh_data = json.load(f)

    # 建立 English -> ID 映射
    en_text_to_id = {entry[1].lower(): entry[0] for entry in en_data}
    # 建立 ID -> 中文 映射
    id_to_zh_text = {entry[0]: entry[1] for entry in zh_data}

    return en_text_to_id, id_to_zh_text


def replace_name_field(obj, en_text_to_id, id_to_zh_text):
    if isinstance(obj, dict):
        new_obj = {}
        for key, value in obj.items():
            if key == "name" and isinstance(value, str):
                print(f'找到 name="{value}"，准备匹配...')
                value_lower = value.lower()
                if value_lower in en_text_to_id:
                    id_ = en_text_to_id[value_lower]
                    zh_text = id_to_zh_text.get(id_)
                    if zh_text:
                        print(f'✔️ 替换 "{value}" → "{zh_text}" (id={id_})')
                        value = zh_text
                    else:
                        print(f'⚠️ 找到 id={id_}，但是 zh.json 里没找到对应中文')
                else:
                    print(f'❌ en.json 没找到匹配 "{value}"（小写 "{value_lower}"），保持不变')
            new_obj[key] = replace_name_field(value, en_text_to_id, id_to_zh_text)
        return new_obj
    elif isinstance(obj, list):
        return [replace_name_field(item, en_text_to_id, id_to_zh_text) for item in obj]
    else:
        return obj



def main(input_json_path, en_json_path, zh_json_path, output_json_path):
    # 加载映射
    en_text_to_id, id_to_zh_text = build_translation_maps(en_json_path, zh_json_path)

    # 加载待处理的 JSON
    with open(input_json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 深拷贝一份数据，防止修改原数据
    new_data = replace_name_field(copy.deepcopy(data), en_text_to_id, id_to_zh_text)

    # 保存结果
    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(new_data, f, ensure_ascii=False, indent=4)

    print(f"\n处理完成，已保存到 {output_json_path}")


if __name__ == "__main__":
    # 你可以修改下面的路径
    input_json_path = r'D:\Workspace\Github\captains-calculator\src\data\storages.json'
    en_json_path = 'en.json'
    zh_json_path = 'zh_Hans.json'
    output_json_path = r'storages.json'

    main(input_json_path, en_json_path, zh_json_path, output_json_path)
