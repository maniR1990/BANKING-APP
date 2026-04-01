import { IsNumber, IsNotEmpty, IsPositive, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransactionDto {
    @ApiProperty({ example: 100.5, description: 'Amount for the transaction' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    amount: number;

    @ApiProperty({
        example: 'customer-uuid-123',
        description: 'Customer UUID'
    })
    @IsString()
    @IsNotEmpty()
    customerId: string;
}
