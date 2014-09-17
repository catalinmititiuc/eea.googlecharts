""" update the source code for the iframe
"""
from Products.Five import BrowserView
import lxml

class Resizer(BrowserView):
    """ iframe resizer
    """
    def update_iframe(self):
        """ update the source code for the iframe
        """
        old_src = self.request.get("old_src", "")
        old_width = self.request.get("old_width", "")
        old_height = self.request.get("old_height", "")
        new_src = self.request.get("new_src", "")
        new_width = self.request.get("new_width", "")
        new_height = self.request.get("new_height", "")

        if old_src == "" or old_width == "" or old_height == "" or \
            new_src == "" or new_width == "" or new_height == "":
            return "error"
        for field in self.context.schema.fields():
            value = field.getAccessor(self.context)()
            if isinstance(value, str):
                html = lxml.html.fragments_fromstring(value)
                has_changes = False
                new_value = ""
                for element in html:
                    if isinstance(element, lxml.html.HtmlElement):
                        iframes = element.xpath("//iframe")
                        for iframe in iframes:
                            if iframe.get("width") == old_width and \
                                iframe.get("height") == old_height and \
                                iframe.get("src") == old_src:
                                has_changes = True
                                iframe.set("width", new_width)
                                iframe.set("height", new_height)
                                iframe.set("src", new_src)
                        new_value += lxml.html.tostring(element)
                    else:
                        new_value += element
                if has_changes:
                    field.getMutator(self.context)(new_value)
        return "ok"