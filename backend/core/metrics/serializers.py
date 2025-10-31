from rest_framework import serializers

class TechnicianMetricsSerializer(serializers.Serializer):
    productivity = serializers.FloatField()
    average_efficiency = serializers.FloatField()
    utilization = serializers.FloatField()
    tasks_completed = serializers.IntegerField()
    date = serializers.DateField()

class JobOrderProgressSerializer(serializers.Serializer):
    progress_percent = serializers.FloatField()
    total_completed = serializers.IntegerField()
    total_rejected = serializers.IntegerField()
    total_devices = serializers.IntegerField()
    alerts = serializers.ListField(child=serializers.DictField())