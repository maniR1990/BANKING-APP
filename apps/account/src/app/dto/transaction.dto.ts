import { IsNumber, IsNotEmpty, IsPositive, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransactionDto {
    @ApiProperty({ example: 100.5, description: 'Amount for the transaction' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    amount: number;

    @ApiProperty({
        example: { id: 'customer-123' },
        description: 'Customer context object'
    })
    @IsObject()
    @IsNotEmpty()
    customer: any;
}
