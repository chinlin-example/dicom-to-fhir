def delete_none(dict_item):
    temp_dict = dict_item.copy()
    for key, value in temp_dict.items():
        if value is None:
            del dict_item[key]
        elif isinstance(value, dict):
            delete_none(value)
        elif isinstance(value, list):
            for v_i in value:
                if isinstance(v_i, dict):
                    delete_none(v_i)
                pass
            pass
        pass
    pass
    return dict_item


pass