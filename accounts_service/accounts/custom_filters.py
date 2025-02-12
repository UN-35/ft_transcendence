from django import template
import json

register = template.Library()

@register.filter(name='pprint')
def pprint_filter(value):
    return json.dumps(value, indent=2)