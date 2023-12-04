def str2hex(str):
    """
    Encode a string as an hex string
    """
    return "0x" + str.encode("utf-8").hex()

def hex2str(hex):
    """
    Decodes a hex string into a regular string
    """
    return bytes.fromhex(hex[2:])
